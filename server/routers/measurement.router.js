const express = require("express");
const router = express.Router();
const MeasurementService = require("../services/measurement.service");
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

router.get("/", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to view measurements." });
    }
    
    let list = await MeasurementService.getAllMeasurements(req);
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to view measurement details." });
    }
    
    let id = req.params.id;
    let obj = await MeasurementService.getMeasurementById(req, id);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

router.post("/", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to create measurements." });
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
    obj = await MeasurementService.addMeasurement(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

router.post("/bulk-add", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to create measurements." });
    }
    
    let measurements = req.body;
    if (!Array.isArray(measurements)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    measurements.forEach((e, index) => {
      e.addDate = new Date();
      e.updateDate = new Date();
      // Set addedBy to Excel Import for bulk imports
      e.addedBy = "Excel Import";
      e.updatedBy = "Excel Import";
    });
    let result = await MeasurementService.addManyMeasurements(req, measurements);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

router.put("/", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to update measurements." });
    }
    
    let obj = req.body;
    obj.updateDate = new Date();
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    let id = obj._id;
    let result = await MeasurementService.updateMeasurement(req, obj);
    if (result.modifiedCount == 1) {
      obj._id = id;
      
      // Delete existing quotations for this measurement and create new ones
      const QuotationService = require("../services/quotation.service");
      const { ObjectId } = require("mongodb");
      
      // Validate measurementId format
      const measurementIdStr = String(id).trim();
      if (measurementIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(measurementIdStr)) {
        // If measurementId is invalid, just return the updated measurement without creating quotations
        res.status(200).json(obj);
        return;
      }
      
      // Delete all existing quotations for this measurement
      await QuotationService.deleteQuotationsByMeasurementId(req, measurementIdStr);
      
      // Create new quotations from the updated measurement
      // Get the updated measurement
      const updatedMeasurement = await MeasurementService.getMeasurementById(req, measurementIdStr);
      if (updatedMeasurement && updatedMeasurement.products && updatedMeasurement.products.length > 0) {
        // Get enquiry to get customer information
        const EnquiryService = require("../services/enquiry.service");
        let enquiryIdStr;
        if (updatedMeasurement.enquiryId) {
          if (updatedMeasurement.enquiryId instanceof ObjectId) {
            enquiryIdStr = updatedMeasurement.enquiryId.toString();
          } else {
            enquiryIdStr = String(updatedMeasurement.enquiryId).trim();
            if (enquiryIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(enquiryIdStr)) {
              // Skip quotation creation if enquiryId is invalid
              res.status(200).json(obj);
              return;
            }
          }
        } else {
          // Skip quotation creation if enquiryId is missing
          res.status(200).json(obj);
          return;
        }
        
        const enquiry = await EnquiryService.getEnquiryById(req, enquiryIdStr);
        if (enquiry) {
          // Get customer information
          const CustomerService = require("../services/customer.service");
          let customerIdStr;
          if (enquiry.customerId) {
            if (enquiry.customerId instanceof ObjectId) {
              customerIdStr = enquiry.customerId.toString();
            } else {
              customerIdStr = String(enquiry.customerId).trim();
              if (customerIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(customerIdStr)) {
                // Skip quotation creation if customerId is invalid
                res.status(200).json(obj);
                return;
              }
            }
          } else {
            // Skip quotation creation if customerId is missing
            res.status(200).json(obj);
            return;
          }
          
          const customer = await CustomerService.getCustomerById(req, customerIdStr);
          if (customer) {
            // Split products into curtains and accessories
            const curtainProducts = updatedMeasurement.products
              .filter(p => p.productName && p.productName.toLowerCase().includes("curtain"))
              .map(p => ({ ...p }));
            const accessoriesProducts = updatedMeasurement.products
              .filter(p => !p.productName || !p.productName.toLowerCase().includes("curtain"))
              .map(p => ({ ...p }));
            
            // Create curtain quotation if it has products
            if (curtainProducts.length > 0) {
              const curtainQuotation = {
                measurementId: measurementIdStr,
                quotationType: "curtain",
                customerName: customer.name || "",
                address: customer.address || "",
                whatsappNumber: customer.whatsappNumber || "",
                enquiryId: enquiryIdStr,
                enquiry: updatedMeasurement.enquiry || "",
                products: curtainProducts,
                addDate: new Date(),
                updateDate: new Date(),
                addedBy: req.tokenData.name || "",
                updatedBy: req.tokenData.name || ""
              };
              await QuotationService.addQuotation(req, curtainQuotation);
            }
            
            // Create accessories quotation if it has products
            if (accessoriesProducts.length > 0) {
              const accessoriesQuotation = {
                measurementId: measurementIdStr,
                quotationType: "accessories",
                customerName: customer.name || "",
                address: customer.address || "",
                whatsappNumber: customer.whatsappNumber || "",
                enquiryId: enquiryIdStr,
                enquiry: updatedMeasurement.enquiry || "",
                products: accessoriesProducts,
                addDate: new Date(),
                updateDate: new Date(),
                addedBy: req.tokenData.name || "",
                updatedBy: req.tokenData.name || ""
              };
              await QuotationService.addQuotation(req, accessoriesQuotation);
            }
          }
        }
      }
      
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
      return res.status(401).json({ error: "Unauthorized. Authentication required to update measurements." });
    }
    
    let measurements = req.body;
    if (!Array.isArray(measurements)) {
      return res.status(400).json({ message: "Invalid input, expected array" });
    }
    measurements.forEach((e, index) => {
      e.updateDate = new Date();
    });
    let result = await MeasurementService.updateManyMeasurements(req, measurements);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to delete measurements." });
    }
    
    let id = req.params.id;
    let obj = req.body;
    obj = await MeasurementService.deleteMeasurement(req, id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

module.exports = router;



