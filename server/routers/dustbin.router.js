const express = require("express");
const router = express.Router();
const DustbinService = require("../services/dustbin.service");
const multer = require("multer");
const { normalizeNewlines } = require("../utilities/lib");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// GET all dustbins - accessible to all roles (admin, driver, resident)
router.get("/", async (req, res, next) => {
  try {
    let list = await DustbinService.getAllDustbins(req);
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// GET dustbin by ID - accessible to all roles
router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await DustbinService.getDustbinById(req, id);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// POST - Add new dustbin - admin only
router.post("/", upload.any(), async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.tokenData || req.tokenData.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Only admin can add dustbins." });
    }

    let obj = req.body;
    
    // normalize text
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (typeof obj[key] == "string") {
        obj[key] = normalizeNewlines(obj[key]);
      }
    }
    
    obj.addDate = new Date();
    obj.updateDate = new Date();
    
    // Add addedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.addedBy = req.tokenData.name;
      obj.updatedBy = req.tokenData.name;
    }
    
    obj = await DustbinService.addDustbin(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// PUT - Update dustbin
// Admin: can update all fields
// Driver: can update only status and lastCleanedDate
router.put("/", upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    
    // Check authentication
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    // If driver role, restrict to status and lastCleanedDate updates only
    if (req.tokenData.role === "driver") {
      const allowedFields = ["_id", "status", "lastCleanedDate"];
      const requestedFields = Object.keys(obj);
      const hasRestrictedFields = requestedFields.some(
        field => !allowedFields.includes(field)
      );
      
      if (hasRestrictedFields) {
        return res.status(403).json({ 
          error: "Forbidden. Drivers can only update status and lastCleanedDate." 
        });
      }
    }
    
    // Resident cannot update
    if (req.tokenData.role === "resident") {
      return res.status(403).json({ 
        error: "Forbidden. Residents have read-only access." 
      });
    }
    
    obj.updateDate = new Date();
    
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    
    let id = obj._id;
    let result = await DustbinService.updateDustbin(req, obj);
    
    if (result.modifiedCount == 1) {
      obj._id = id;
      res.status(200).json(obj);
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// DELETE dustbin - admin only
router.delete("/:id", async (req, res, next) => {
  try {
    // Check if user is admin
    if (!req.tokenData || req.tokenData.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Only admin can delete dustbins." });
    }
    
    let id = req.params.id;
    let obj = await DustbinService.deleteDustbin(req, id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

module.exports = router;
