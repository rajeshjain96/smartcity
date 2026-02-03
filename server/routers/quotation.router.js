const express = require("express");
const router = express.Router();
const QuotationService = require("../services/quotation.service");
const multer = require("multer");
const { normalizeNewlines } = require("../utilities/lib");
const { ObjectId } = require("mongodb");

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
    let list = await QuotationService.getAllQuotations(req);
    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await QuotationService.getQuotationById(req, id);
    res.send(obj);
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (typeof obj[key] == "string") {
        obj[key] = normalizeNewlines(obj[key]);
      }
    }
    obj.addDate = new Date();
    obj.updateDate = new Date();
    // Add addedBy and updatedBy fields with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.addedBy = req.tokenData.name;
      obj.updatedBy = req.tokenData.name;
    }
    obj = await QuotationService.addQuotation(req, obj);
    res.status(201).json(obj);
  } catch (error) {
    next(error);
  }
});

router.post("/create-from-measurement", upload.any(), async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.tokenData || !req.tokenData.shopurl || req.tokenData.role === "guest") {
      return res.status(401).json({ error: "Unauthorized. Authentication required to create quotations." });
    }
    
    let { measurementId } = req.body;
    if (!measurementId) {
      return res.status(400).json({ error: "Measurement ID is required" });
    }
    
    // Validate measurementId format (must be 24 character hex string)
    const measurementIdStr = String(measurementId).trim();
    if (measurementIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(measurementIdStr)) {
      return res.status(400).json({ error: "Invalid measurement ID format. Must be a valid 24-character hex string." });
    }
    
    // Get measurement
    const MeasurementService = require("../services/measurement.service");
    const measurement = await MeasurementService.getMeasurementById(req, measurementIdStr);
    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }
    
    // Get enquiry to get customer information
    const EnquiryService = require("../services/enquiry.service");
    // Handle enquiryId - could be ObjectId or string
    let enquiryIdStr;
    if (measurement.enquiryId) {
      if (measurement.enquiryId instanceof ObjectId) {
        enquiryIdStr = measurement.enquiryId.toString();
      } else {
        enquiryIdStr = String(measurement.enquiryId).trim();
        // Validate format if it's a string
        if (enquiryIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(enquiryIdStr)) {
          return res.status(400).json({ error: "Invalid enquiry ID format in measurement." });
        }
      }
    } else {
      return res.status(400).json({ error: "Measurement is missing enquiryId." });
    }
    
    const enquiry = await EnquiryService.getEnquiryById(req, enquiryIdStr);
    if (!enquiry) {
      return res.status(404).json({ error: "Enquiry not found" });
    }
    
    // Get customer information
    const CustomerService = require("../services/customer.service");
    // Handle customerId - could be ObjectId or string
    let customerIdStr;
    if (enquiry.customerId) {
      if (enquiry.customerId instanceof ObjectId) {
        customerIdStr = enquiry.customerId.toString();
      } else {
        customerIdStr = String(enquiry.customerId).trim();
        // Validate format if it's a string
        if (customerIdStr.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(customerIdStr)) {
          return res.status(400).json({ error: "Invalid customer ID format in enquiry." });
        }
      }
    } else {
      return res.status(400).json({ error: "Enquiry is missing customerId." });
    }
    
    const customer = await CustomerService.getCustomerById(req, customerIdStr);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    // Check if quotations already exist for this measurement
    // Convert measurementId to ObjectId for proper comparison
    const measurementObjectId = ObjectId.createFromHexString(measurementIdStr);
    const existingQuotations = await QuotationService.getAllQuotations(req);
    const quotationsForMeasurement = existingQuotations.filter(q => {
      // Handle both ObjectId and string formats
      const qMeasurementId = q.measurementId;
      if (qMeasurementId) {
        if (qMeasurementId instanceof ObjectId) {
          return qMeasurementId.equals(measurementObjectId);
        } else {
          return String(qMeasurementId) === measurementIdStr;
        }
      }
      return false;
    });
    
    // Check if both quotation types exist
    const existingCurtainQuotation = quotationsForMeasurement.find(q => q.quotationType === "curtain");
    const existingAccessoriesQuotation = quotationsForMeasurement.find(q => q.quotationType === "accessories");
    
    // Split products into curtains and accessories
    // Curtain quotation: products with "Curtains" (case-insensitive match)
    // Accessories quotation: all other products
    // Ensure all product fields including 'place' are preserved
    const curtainProducts = measurement.products ? measurement.products
      .filter(p => p.productName && p.productName.toLowerCase().includes("curtain"))
      .map(p => ({ ...p })) // Create a copy to ensure all fields are preserved
      : [];
    const accessoriesProducts = measurement.products ? measurement.products
      .filter(p => !p.productName || !p.productName.toLowerCase().includes("curtain"))
      .map(p => ({ ...p })) // Create a copy to ensure all fields are preserved
      : [];
    
    const quotations = [];
    let createdNew = false;
    let updatedExisting = false;
    
    // Create curtain quotation only if it doesn't exist AND has products
    if (!existingCurtainQuotation && curtainProducts.length > 0) {
      const curtainQuotation = {
        measurementId: measurementIdStr,
        quotationType: "curtain",
        customerName: customer.name || "",
        address: customer.address || "",
        whatsappNumber: customer.whatsappNumber || "",
        enquiryId: enquiryIdStr,
        enquiry: measurement.enquiry || "",
        products: curtainProducts || [],
        addDate: new Date(),
        updateDate: new Date(),
        addedBy: req.tokenData.name || "",
        updatedBy: req.tokenData.name || ""
      };
      const createdCurtain = await QuotationService.addQuotation(req, curtainQuotation);
      quotations.push(createdCurtain);
      createdNew = true;
    } else if (existingCurtainQuotation) {
      // If quotation exists, sync place values from measurement to quotation products
      if (curtainProducts.length > 0 && existingCurtainQuotation.products && existingCurtainQuotation.products.length > 0) {
        // Create a map of measurement products by productName and index for matching
        const measurementProductMap = new Map();
        curtainProducts.forEach((mp, idx) => {
          const key = `${mp.productName || ''}_${idx}`;
          measurementProductMap.set(key, mp);
        });
        
        // Update quotation products with place values from measurement
        const updatedProducts = existingCurtainQuotation.products.map((qp, idx) => {
          // Try to match by productName and index
          const key = `${qp.productName || ''}_${idx}`;
          const matchingMeasurementProduct = measurementProductMap.get(key);
          
          // If we found a matching product in measurement, sync the place value
          if (matchingMeasurementProduct && matchingMeasurementProduct.place) {
            return { ...qp, place: matchingMeasurementProduct.place };
          }
          
          // Also try to find by productName only (in case order changed)
          const matchingByName = curtainProducts.find(mp => 
            mp.productName === qp.productName && mp.place
          );
          if (matchingByName) {
            return { ...qp, place: matchingByName.place };
          }
          
          return qp;
        });
        
        // Update the quotation if any products were modified
        const hasChanges = updatedProducts.some((qp, idx) => 
          qp.place !== existingCurtainQuotation.products[idx].place
        );
        
        if (hasChanges) {
          existingCurtainQuotation.products = updatedProducts;
          existingCurtainQuotation.updateDate = new Date();
          existingCurtainQuotation.updatedBy = req.tokenData.name || "";
          const updatedQuotation = await QuotationService.updateQuotation(req, existingCurtainQuotation);
          if (updatedQuotation) {
            quotations.push(updatedQuotation);
            updatedExisting = true;
          } else {
            quotations.push(existingCurtainQuotation);
          }
        } else {
          quotations.push(existingCurtainQuotation);
        }
      } else {
        quotations.push(existingCurtainQuotation);
      }
    }
    
    // Create accessories quotation only if it doesn't exist AND has products
    if (!existingAccessoriesQuotation && accessoriesProducts.length > 0) {
      const accessoriesQuotation = {
        measurementId: measurementIdStr,
        quotationType: "accessories",
        customerName: customer.name || "",
        address: customer.address || "",
        whatsappNumber: customer.whatsappNumber || "",
        enquiryId: enquiryIdStr,
        enquiry: measurement.enquiry || "",
        products: accessoriesProducts || [],
        addDate: new Date(),
        updateDate: new Date(),
        addedBy: req.tokenData.name || "",
        updatedBy: req.tokenData.name || ""
      };
      const createdAccessories = await QuotationService.addQuotation(req, accessoriesQuotation);
      quotations.push(createdAccessories);
      createdNew = true;
    } else if (existingAccessoriesQuotation) {
      // If quotation exists, sync place values from measurement to quotation products
      if (accessoriesProducts.length > 0 && existingAccessoriesQuotation.products && existingAccessoriesQuotation.products.length > 0) {
        // Create a map of measurement products by productName and index for matching
        const measurementProductMap = new Map();
        accessoriesProducts.forEach((mp, idx) => {
          const key = `${mp.productName || ''}_${idx}`;
          measurementProductMap.set(key, mp);
        });
        
        // Update quotation products with place values from measurement
        const updatedProducts = existingAccessoriesQuotation.products.map((qp, idx) => {
          // Try to match by productName and index
          const key = `${qp.productName || ''}_${idx}`;
          const matchingMeasurementProduct = measurementProductMap.get(key);
          
          // If we found a matching product in measurement, sync the place value
          if (matchingMeasurementProduct && matchingMeasurementProduct.place) {
            return { ...qp, place: matchingMeasurementProduct.place };
          }
          
          // Also try to find by productName only (in case order changed)
          const matchingByName = accessoriesProducts.find(mp => 
            mp.productName === qp.productName && mp.place
          );
          if (matchingByName) {
            return { ...qp, place: matchingByName.place };
          }
          
          return qp;
        });
        
        // Update the quotation if any products were modified
        const hasChanges = updatedProducts.some((qp, idx) => 
          qp.place !== existingAccessoriesQuotation.products[idx].place
        );
        
        if (hasChanges) {
          existingAccessoriesQuotation.products = updatedProducts;
          existingAccessoriesQuotation.updateDate = new Date();
          existingAccessoriesQuotation.updatedBy = req.tokenData.name || "";
          const updatedQuotation = await QuotationService.updateQuotation(req, existingAccessoriesQuotation);
          if (updatedQuotation) {
            quotations.push(updatedQuotation);
            updatedExisting = true;
          } else {
            quotations.push(existingAccessoriesQuotation);
          }
        } else {
          quotations.push(existingAccessoriesQuotation);
        }
      } else {
        quotations.push(existingAccessoriesQuotation);
      }
    }
    
    if (createdNew) {
      res.status(201).json({ quotations, message: `Successfully created ${quotations.length} quotation(s)`, alreadyExists: false });
    } else if (updatedExisting) {
      res.status(200).json({ 
        quotations, 
        message: "Quotations updated with latest measurement data (place values synced)",
        alreadyExists: true,
        updated: true
      });
    } else {
      res.status(200).json({ 
        quotations, 
        message: "Quotations already exist for this measurement",
        alreadyExists: true
      });
    }
  } catch (error) {
    next(error);
  }
});

router.put("/", upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    obj.updateDate = new Date();
    // Add updatedBy field with user's name if available
    if (req.tokenData && req.tokenData.name) {
      obj.updatedBy = req.tokenData.name;
    }
    let id = obj._id;
    let result = await QuotationService.updateQuotation(req, obj);
    if (result) {
      result._id = id;
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Quotation not found or unauthorized" });
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await QuotationService.deleteQuotation(req, id);
    res.json(obj);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

