const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllEnquiries(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);

  const collection = db.collection("enquiries");
  const customerCollection = db.collection("customers");

  // Build query based on query parameters
  let query = {};
  if (req.query && req.query.customerId) {
    query.customerId = req.query.customerId;
  }

  let list = await collection.find(query).toArray();
  
  // Get all valid customer IDs
  const customers = await customerCollection.find({}).toArray();
  const validCustomerIds = new Set(
    customers.map(c => String(c._id))
  );
  
  // Filter out enquiries where customer doesn't exist
  list = list.filter(enquiry => {
    if (!enquiry.customerId) return false;
    const customerIdStr = String(enquiry.customerId);
    return validCustomerIds.has(customerIdStr);
  });

  return list;
}
async function getEnquiryById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  const enquiryObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  console.log(enquiryObj);

  return enquiryObj;
}
async function generateEnquiryCode(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  
  const now = new Date();
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const prefix = `${month}${year}-`;
  
  // Find the last enquiry with a code matching this month/year pattern
  const regex = new RegExp(`^${prefix}\\d+$`);
  const lastEnquiry = await collection
    .find({ code: { $regex: regex } })
    .sort({ code: -1 })
    .limit(1)
    .toArray();
  
  let sequenceNumber = 1;
  if (lastEnquiry.length > 0 && lastEnquiry[0].code) {
    // Extract the sequence number from the last code
    const lastCode = lastEnquiry[0].code;
    const match = lastCode.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match && match[1]) {
      sequenceNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  return `${prefix}${sequenceNumber}`;
}

async function addEnquiry(req,obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  
  // Generate code if not provided
  if (!obj.code || obj.code.trim() === '') {
    obj.code = await generateEnquiryCode(req);
  }
  
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
async function addManyEnquiries(req, enquiries) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  const result = await collection.insertMany(enquiries);
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = await collection
    .find({ _id: { $in: insertedIds } })
    .toArray();
  return insertedDocs;
}
async function updateManyEnquiries(req, enquiries) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  // Prepare bulk operations
  const operations = enquiries.map((enquiry) => {
    const { _id, ...fieldsToUpdate } = enquiry;
    return {
      updateOne: {
        filter: { _id: ObjectId.createFromHexString(_id) },
        update: { $set: fieldsToUpdate },
      },
    };
  });
  const result = await collection.bulkWrite(operations);
  const updatedIds = enquiries.map((p) => ObjectId.createFromHexString(p._id));

  const updatedEnquiries = await collection
    .find({ _id: { $in: updatedIds } })
    .toArray();
  return updatedEnquiries;
}
async function updateEnquiry(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("enquiries");
  let id = obj._id;
  delete obj._id;
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return result;
}
async function deleteEnquiry(req, id) {
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
  const collection = db.collection("enquiries");
  let result = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return result;
}
normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};
module.exports = EnquiryService = {
  getAllEnquiries,
  getEnquiryById,
  addEnquiry,
  addManyEnquiries,
  updateManyEnquiries,
  updateEnquiry,
  deleteEnquiry,
};
