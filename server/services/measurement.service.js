const { app } = require("../init.js");
const { ObjectId } = require("mongodb");
const { normalizeNewlines } = require("../utilities/lib");

async function getAllMeasurements(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  
  // Build query based on query parameters
  let query = {};
  if (req.query && req.query.enquiryId) {
    // Filter by enquiryId directly
    // Handle both ObjectId and string formats
    const { ObjectId } = require("mongodb");
    const enquiryIdStr = String(req.query.enquiryId).trim();
    try {
      // Try to convert to ObjectId first
      const enquiryObjectId = ObjectId.createFromHexString(enquiryIdStr);
      // Query for both ObjectId and string formats to handle any data inconsistencies
      query.$or = [
        { enquiryId: enquiryObjectId },
        { enquiryId: enquiryIdStr }
      ];
    } catch (error) {
      // If conversion fails, just use the string
      query.enquiryId = enquiryIdStr;
    }
  } else if (req.query && req.query.customerId) {
    // Measurements don't have customerId directly, they have enquiryId
    // So we need to find enquiries with this customerId first
    const enquiryCollection = db.collection("enquiries");
    const customerIdStr = String(req.query.customerId).trim();
    
    // Handle both ObjectId and string formats for customerId
    let customerIdQuery;
    try {
      const customerObjectId = ObjectId.createFromHexString(customerIdStr);
      customerIdQuery = { $or: [
        { customerId: customerObjectId },
        { customerId: customerIdStr }
      ]};
    } catch (error) {
      // If conversion fails, just use the string
      customerIdQuery = { customerId: customerIdStr };
    }
    
    const enquiries = await enquiryCollection.find(customerIdQuery).toArray();
    const enquiryIds = enquiries.map(e => e._id);
    
    if (enquiryIds.length > 0) {
      query.enquiryId = { $in: enquiryIds };
    } else {
      // No enquiries found for this customer, return empty array
      return [];
    }
  }
  
  let list = await collection.find(query).toArray();
  return list;
}

async function getMeasurementById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  const measurementObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return measurementObj;
}

async function addMeasurement(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  
  // normalize text
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}

async function addManyMeasurements(req, measurements) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  const result = await collection.insertMany(measurements);
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = await collection
    .find({ _id: { $in: insertedIds } })
    .toArray();
  return insertedDocs;
}

async function updateManyMeasurements(req, measurements) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  // Prepare bulk operations
  const operations = measurements.map((measurement) => {
    const { _id, ...fieldsToUpdate } = measurement;
    return {
      updateOne: {
        filter: { _id: ObjectId.createFromHexString(_id) },
        update: { $set: fieldsToUpdate },
      },
    };
  });
  const result = await collection.bulkWrite(operations);
  const updatedIds = measurements.map((p) => ObjectId.createFromHexString(p._id));
  const updatedMeasurements = await collection
    .find({ _id: { $in: updatedIds } })
    .toArray();
  return updatedMeasurements;
}

async function updateMeasurement(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("measurements");
  let id = obj._id;
  delete obj._id;
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return result;
}

async function deleteMeasurement(req, id) {
  if (!req) {
    throw new Error("Request object is not available");
  }
  
  // Try to get mongoClient from req.app.locals, fallback to app.locals if needed
  let client;
  if (req.app && req.app.locals && req.app.locals.mongoClient) {
    client = req.app.locals.mongoClient;
  } else if (app && app.locals && app.locals.mongoClient) {
    client = app.locals.mongoClient;
  } else {
    throw new Error("MongoDB client is not available");
  }
  
  if (!req.tokenData || !req.tokenData.shopurl) {
    throw new Error("Token data or shopurl is not available. User may not be authenticated.");
  }
  
  const db = client.db("homedecor_" + req.tokenData.shopurl);
  const collection = db.collection("measurements");
  let result = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return result;
}

module.exports = MeasurementService = {
  getAllMeasurements,
  getMeasurementById,
  addMeasurement,
  addManyMeasurements,
  updateManyMeasurements,
  updateMeasurement,
  deleteMeasurement,
};



