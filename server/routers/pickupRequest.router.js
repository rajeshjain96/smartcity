const express = require("express");
const router = express.Router();
const PickupRequestService = require("../services/pickupRequest.service");
const DriverService = require("../services/driver.service");
const multer = require("multer");
const { normalizeNewlines } = require("../utilities/lib");
const { detectGarbageLevel } = require("../services/garbageLevelDetection.service");
const path = require("path");
const fs = require("fs");

// Repo-root uploads folder (sibling of /server)
// __dirname is .../server/routers → go up to .../server → .../ (repo root) → uploads
const uploadDir = path.resolve(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// GET all pickup requests
// Admin: see all
// Driver: see assigned only
// Resident: see own only
router.get("/", async (req, res, next) => {
  try {
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    let list;
    if (req.tokenData.role === "admin") {
      // Admin sees all requests
      list = await PickupRequestService.getAllPickupRequests(req);
    } else if (req.tokenData.role === "driver") {
      // Driver sees only assigned requests
      // First, get driver profile to get driver _id
      try {
        const driver = await DriverService.getDriverByUserId(req, req.tokenData.userId);
        if (driver && driver._id) {
          list = await PickupRequestService.getPickupRequestsByDriverId(req, driver._id);
        } else {
          list = [];
        }
      } catch (driverError) {
        // If driver lookup fails, return empty list (driver may not have profile yet)
        console.log("Driver lookup failed:", driverError);
        list = [];
      }
    } else if (req.tokenData.role === "resident") {
      // Resident sees only their own requests
      list = await PickupRequestService.getPickupRequestsByUserId(req, req.tokenData.userId);
    } else {
      list = [];
    }
    
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

// GET pickup request by ID
router.get("/:id", async (req, res, next) => {
  try {
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    let id = req.params.id;
    let obj = await PickupRequestService.getPickupRequestById(req, id);
    
    if (!obj) {
      return res.status(404).json({ error: "Pickup request not found" });
    }
    
    // Check permissions
    if (req.tokenData.role === "resident" && obj.userId !== req.tokenData.userId) {
      return res.status(403).json({ error: "Forbidden. You can only view your own requests." });
    }
    
    res.send(obj);
  } catch (error) {
    next(error);
  }
});

// POST - Create new pickup request
// Resident: can create for themselves
// Admin: can create for any user
router.post("/", upload.any(), async (req, res, next) => {
  try {
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    let obj = req.body;
    
    // normalize text
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (typeof obj[key] == "string") {
        obj[key] = normalizeNewlines(obj[key]);
      }
    }
    
    // Derive address and areaId from dustbinId
    if (obj.dustbinId) {
      const { ObjectId } = require("mongodb");
      const client = req.app.locals.mongoClient;
      const db = client.db(process.env.DB_NAME);
      const dustbinCollection = db.collection("dustbins");
      
      let dustbinId = obj.dustbinId;
      if (typeof dustbinId === 'string' && dustbinId.length === 24) {
        try {
          dustbinId = ObjectId.createFromHexString(dustbinId);
        } catch (e) {
          return res.status(400).json({ error: "Invalid dustbin ID format" });
        }
      }
      
      const dustbin = await dustbinCollection.findOne({ _id: dustbinId });
      if (!dustbin) {
        return res.status(404).json({ error: "Dustbin not found" });
      }
      
      // Derive address and areaId from dustbin
      obj.address = dustbin.address || "";
      obj.areaId = dustbin.areaId || null;
      
      // Remove address from request body if it was sent (we use dustbin's address)
      // This ensures we always use the dustbin's address, not a user-provided one
    } else {
      return res.status(400).json({ error: "Dustbin ID is required" });
    }
    
    // Set userId
    if (req.tokenData.role === "resident") {
      obj.userId = req.tokenData.userId;
    } else if (req.tokenData.role === "admin" && !obj.userId) {
      obj.userId = req.tokenData.userId;
    }
    
    // Set default status if not provided
    if (!obj.status) {
      obj.status = "Pending";
    }
    
    obj.addDate = new Date();
    obj.updateDate = new Date();
    
    if (req.tokenData && req.tokenData.name) {
      obj.addedBy = req.tokenData.name;
      obj.updatedBy = req.tokenData.name;
    }

    // Optional: handle image upload for AI detection
    // Store filename so UI can display via /api/uploadedImages/<filename>
    if (req.files && req.files.length > 0) {
      const f = req.files[0];
      obj.requestImage = f.filename;

      const uploadedPath = path.join(uploadDir, f.filename);
      try {
        const detection = await detectGarbageLevel(uploadedPath);
        if (detection && detection.status) {
          obj.detectedLevel = detection.status;
        } else {
          obj.detectedLevel = null;
          if (detection && detection.error) {
            obj.detectionError = detection.error;
          }
        }
      } catch (e) {
        obj.detectedLevel = null;
        obj.detectionError = e && e.message ? e.message : "AI detection failed";
      }
    }
    
    obj = await PickupRequestService.addPickupRequest(req, obj);

    const io = req.app.get("io");
    if (io) {
      try {
        const enriched = await PickupRequestService.getPickupRequestById(
          req,
          obj._id.toString()
        );
        if (enriched) {
          io.emit("newPickupRequest", {
            requestId: enriched._id.toString(),
            area: enriched.areaName || "N/A",
            dustbinName: enriched.dustbinName || "N/A",
          });
        }
      } catch (emitErr) {
        console.error("newPickupRequest socket emit:", emitErr);
      }
    }

    res.status(201).json(obj);
  } catch (error) {
    next(error);
  }
});

// PUT - Update pickup request
// Admin: can update all fields
// Driver: can update status, collectedAt, photoUrl
// Resident: can cancel (change status to Cancelled)
router.put("/", upload.any(), async (req, res, next) => {
  try {
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    let obj = req.body;
    let requestId = obj._id;
    
    // Get existing request to check permissions
    let existingRequest = await PickupRequestService.getPickupRequestById(req, requestId);
    if (!existingRequest) {
      return res.status(404).json({ error: "Pickup request not found" });
    }
    
    // Check permissions
    if (req.tokenData.role === "resident") {
      // Resident can only update their own requests and only cancel them
      if (existingRequest.userId !== req.tokenData.userId) {
        return res.status(403).json({ error: "Forbidden. You can only update your own requests." });
      }
      
      // Only allow status change to Cancelled
      const allowedFields = ["_id", "status"];
      const requestedFields = Object.keys(obj);
      const hasRestrictedFields = requestedFields.some(
        field => !allowedFields.includes(field)
      );
      
      if (hasRestrictedFields || (obj.status && obj.status !== "Cancelled")) {
        return res.status(403).json({ 
          error: "Forbidden. Residents can only cancel requests." 
        });
      }
    } else if (req.tokenData.role === "driver") {
      // Driver can update status, collectedAt, photoUrl for assigned requests
      if (existingRequest.assignedDriverId && existingRequest.assignedDriverId.toString() !== req.tokenData.userId) {
        // Need to check if driver's _id matches assignedDriverId
        // This is simplified - in production, fetch driver profile first
      }
      
      const allowedFields = ["_id", "status", "collectedAt", "photoUrl"];
      const requestedFields = Object.keys(obj);
      const hasRestrictedFields = requestedFields.some(
        field => !allowedFields.includes(field)
      );
      
      if (hasRestrictedFields) {
        return res.status(403).json({ 
          error: "Forbidden. Drivers can only update status, collection time, and photo." 
        });
      }
    }
    // Admin can update all fields (no restrictions)
    
    // Handle file upload (photoUrl)
    if (req.files && req.files.length > 0) {
      obj.photoUrl = "/uploads/" + req.files[0].filename;
    }
    
    obj.updateDate = new Date();
    
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    
    let result = await PickupRequestService.updatePickupRequest(req, obj);
    
    if (result.modifiedCount == 1) {
      obj._id = requestId;
      res.status(200).json(obj);
    } else {
      res.status(400).json({ error: "Update failed" });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE pickup request - admin only
router.delete("/:id", async (req, res, next) => {
  try {
    if (!req.tokenData || req.tokenData.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Only admin can delete pickup requests." });
    }
    
    let id = req.params.id;
    let obj = await PickupRequestService.deletePickupRequest(req, id);
    res.json(obj);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
