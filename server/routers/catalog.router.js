const express = require("express");
const router = express.Router();
const CatalogService = require("../services/catalog.service");
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

router.get("/", allowToAdminOnly, async (req, res, next) => {
  try {
    let list = await CatalogService.getAllCatalogs(req);
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await CatalogService.getCatalogById(req, id);
    res.send(obj);
  } catch (error) {
    next(error);
  }
});

router.post("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (typeof obj[key] == "string") {
        obj[key] = normalizeNewlines(obj[key]);
      }
    }
    // Convert priceInRs to number if it's a string and round to integer
    if (obj.priceInRs) {
      obj.priceInRs = Math.round(parseFloat(obj.priceInRs));
    }
    obj.addDate = new Date();
    obj.updateDate = new Date();
    obj = await CatalogService.addCatalog(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error);
  }
});

router.post("/bulk-add", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let catalogs = req.body;
    if (!Array.isArray(catalogs)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    catalogs.forEach((e, index) => {
      e.addDate = new Date();
      e.updateDate = new Date();
      e.addedBy = "Excel Import";
      e.updatedBy = "Excel Import";
    });
    let result = await CatalogService.addManyCatalogs(req, catalogs);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.put("/", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    // Convert priceInRs to number if it's a string and round to integer
    if (obj.priceInRs) {
      obj.priceInRs = Math.round(parseFloat(obj.priceInRs));
    }
    obj.updateDate = new Date();
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    let id = obj._id;
    let result = await CatalogService.updateCatalog(req, obj);
    if (result) {
      result._id = id;
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Catalog not found or unauthorized" });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/bulk-update", allowToAdminOnly, upload.any(), async (req, res, next) => {
  try {
    let catalogs = req.body;
    if (!Array.isArray(catalogs)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    catalogs.forEach((e, index) => {
      e.updateDate = new Date();
      // Add updatedBy field with user's name if available
      if (req.tokenData && req.tokenData.name) {
        e.updatedBy = req.tokenData.name;
      } else {
        e.updatedBy = "Excel Import";
      }
    });
    let result = await CatalogService.updateManyCatalogs(req, catalogs);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await CatalogService.deleteCatalog(req, id);
    res.json(obj);
  } catch (error) {
    next(error);
  }
});

function allowToAdminOnly(req, res, next) {
  if (
    !req.tokenData ||
    req.tokenData.role == "guest" ||
    req.tokenData.role == "user"
  ) {
    res.status(401).json({ message: "Unauthorized" });
  } else if (req.tokenData.role == "admin" || req.tokenData.role == "staff") {
    next();
  } else {
    res.status(401).json({ message: "OOPs...Some Error.." });
  }
}

module.exports = router;

