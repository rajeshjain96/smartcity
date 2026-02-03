const express = require("express");
const router = express.Router();
const EnquiryService = require("../services/enquiry.service");
const multer = require("multer");
const { normalizeNewlines } = require("../utilities/lib");
// const upload = multer({ dest: "uploads/" });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
router.get("/", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to view enquiries." });
    }
    
    let list = await EnquiryService.getAllEnquiries(req);
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to view enquiry details." });
    }
    
    let id = req.params.id;
    let obj = await EnquiryService.getEnquiryById(req, id);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.post("/", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to create enquiries." });
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
    obj = await EnquiryService.addEnquiry(req,obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.post("/bulk-add", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to create enquiries." });
    }
    
    let enquiries = req.body;
    if (!Array.isArray(enquiries)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    enquiries.forEach((e, index) => {
      e.addDate = new Date();
      e.updateDate = new Date();
      // Set addedBy to Excel Import for bulk imports
      e.addedBy = "Excel Import";
      e.updatedBy = "Excel Import";
    });
    let result = await EnquiryService.addManyEnquiries(req, enquiries);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.put("/", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to update enquiries." });
    }
    
    let obj = req.body;
    obj.updateDate = new Date();
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    let id = obj._id;
    let result = await EnquiryService.updateEnquiry(req, obj);
    if (result.modifiedCount == 1) {
      obj._id = id;
      res.status(200).json(obj);
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.put("/bulk-update", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to update enquiries." });
    }
    
    let enquiries = req.body;
    if (!Array.isArray(enquiries)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    enquiries.forEach((e, index) => {
      e.updateDate = new Date();
    });
    let result = await EnquiryService.updateManyEnquiries(req, enquiries);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to delete enquiries." });
    }
    
    let id = req.params.id;
    let obj = req.body;
    obj = await EnquiryService.deleteEnquiry(req, id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

module.exports = router;
