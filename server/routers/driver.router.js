const express = require("express");
const router = express.Router();
const DriverService = require("../services/driver.service");
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

// GET all drivers - admin only
router.get("/", allowToAdminOnly, async (req, res, next) => {
  try {
    let list = await DriverService.getAllDrivers(req);
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// GET driver by ID - admin or self
router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    
    // Check if user is admin or accessing own profile
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    let obj = await DriverService.getDriverById(req, id);
    
    // If driver role, ensure they can only access their own profile
    if (req.tokenData.role === "driver") {
      if (obj && obj.userId !== req.tokenData.userId) {
        return res.status(403).json({ error: "Forbidden. You can only access your own profile." });
      }
    }
    
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// GET driver by userId - admin or self
router.get("/user/:userId", async (req, res, next) => {
  try {
    let userId = req.params.userId;
    
    // Check if user is admin or accessing own profile
    if (!req.tokenData || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required." });
    }
    
    // If driver role, ensure they can only access their own profile
    if (req.tokenData.role === "driver" && req.tokenData.userId !== userId) {
      return res.status(403).json({ error: "Forbidden. You can only access your own profile." });
    }
    
    let obj = await DriverService.getDriverByUserId(req, userId);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// POST - Add new driver - admin only
router.post("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    
    // Parse assignedAreaIds if it's a string
    if (typeof obj.assignedAreaIds === 'string') {
      try {
        obj.assignedAreaIds = JSON.parse(obj.assignedAreaIds);
      } catch (e) {
        obj.assignedAreaIds = [];
      }
    }
    
    // Ensure assignedAreaIds is an array
    if (!Array.isArray(obj.assignedAreaIds)) {
      obj.assignedAreaIds = [];
    }
    
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
    
    obj = await DriverService.addDriver(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// PUT - Update driver - admin only
router.put("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    
    // Parse assignedAreaIds if it's a string
    if (typeof obj.assignedAreaIds === 'string') {
      try {
        obj.assignedAreaIds = JSON.parse(obj.assignedAreaIds);
      } catch (e) {
        obj.assignedAreaIds = [];
      }
    }
    
    // Ensure assignedAreaIds is an array
    if (!Array.isArray(obj.assignedAreaIds)) {
      obj.assignedAreaIds = [];
    }
    
    obj.updateDate = new Date();
    
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    
    let id = obj._id;
    let result = await DriverService.updateDriver(req, obj);
    
    if (result.modifiedCount == 1) {
      obj._id = id;
      res.status(200).json(obj);
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// DELETE driver - admin only
router.delete("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await DriverService.deleteDriver(req, id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

function allowToAdminOnly(req, res, next) {
  if (
    !req.tokenData ||
    req.tokenData.role == "guest" ||
    req.tokenData.role == "user" ||
    req.tokenData.role == "driver" ||
    req.tokenData.role == "resident"
  ) {
    res.status(401).json({ message: "Unauthorized. Admin access required." });
  } else if (req.tokenData.role == "admin") {
    next(); // allow
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = router;
