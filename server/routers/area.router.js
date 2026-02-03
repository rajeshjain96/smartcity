const express = require("express");
const router = express.Router();
const AreaService = require("../services/area.service");
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

// GET all areas - admin only
router.get("/", allowToAdminOnly, async (req, res, next) => {
  try {
    let list = await AreaService.getAllAreas(req);
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// GET area by ID - admin only
router.get("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await AreaService.getAreaById(req, id);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// POST - Add new area - admin only
router.post("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
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
    
    obj = await AreaService.addArea(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// PUT - Update area - admin only
router.put("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    
    obj.updateDate = new Date();
    
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    
    let id = obj._id;
    let result = await AreaService.updateArea(req, obj);
    
    if (result.modifiedCount == 1) {
      obj._id = id;
      res.status(200).json(obj);
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});

// DELETE area - admin only
router.delete("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await AreaService.deleteArea(req, id);
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
