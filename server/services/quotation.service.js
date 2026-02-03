const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllQuotations(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");

  // Build query based on query parameters
  let query = {};
  if (req.query && req.query.measurementId) {
    // Filter by measurementId directly
    const { ObjectId } = require("mongodb");
    const measurementIdStr = String(req.query.measurementId).trim();
    try {
      // Try to convert to ObjectId first
      const measurementObjectId = ObjectId.createFromHexString(measurementIdStr);
      // Query for both ObjectId and string formats to handle any data inconsistencies
      query.$or = [
        { measurementId: measurementObjectId },
        { measurementId: measurementIdStr }
      ];
    } catch (error) {
      // If conversion fails, just use the string
      query.measurementId = measurementIdStr;
    }
  } else if (req.query && req.query.enquiryId) {
    // Quotations don't have enquiryId directly, they have measurementId
    // So we need to find measurements with this enquiryId first
    const { ObjectId } = require("mongodb");
    const measurementCollection = db.collection("measurements");
    const measurements = await measurementCollection.find({ enquiryId: ObjectId.createFromHexString(req.query.enquiryId) }).toArray();
    const measurementIds = measurements.map(m => m._id);
    
    if (measurementIds.length > 0) {
      query.measurementId = { $in: measurementIds };
    } else {
      // No measurements found for this enquiry, return empty array
      return [];
    }
  } else if (req.query && req.query.customerName) {
    // Use case-insensitive regex for partial matching
    query.customerName = { $regex: req.query.customerName, $options: "i" };
  }

  let list = await collection.find(query).toArray();

  return list;
}
async function getQuotationById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");
  
  const quotationObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return quotationObj;
}
async function addQuotation(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}
async function updateQuotation(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");
  let id = obj._id;
  delete obj._id;
  
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  if (result.modifiedCount == 1) {
    obj._id = id;
    return obj;
  }
  return null;
}
async function deleteQuotation(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");
  
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

async function deleteQuotationsByMeasurementId(req, measurementId) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("quotations");
  
  // Handle both ObjectId and string formats
  let query;
  try {
    const measurementObjectId = ObjectId.createFromHexString(String(measurementId).trim());
    query = {
      $or: [
        { measurementId: measurementObjectId },
        { measurementId: String(measurementId).trim() }
      ]
    };
  } catch (error) {
    // If conversion fails, just use the string
    query = { measurementId: String(measurementId).trim() };
  }
  
  let result = await collection.deleteMany(query);
  return result;
}

module.exports = QuotationService = {
  getAllQuotations,
  getQuotationById,
  addQuotation,
  updateQuotation,
  deleteQuotation,
  deleteQuotationsByMeasurementId,
};

