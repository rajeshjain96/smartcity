const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllDustbins(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("dustbins");
  let list = await collection.find().toArray();
  return list;
}

async function getDustbinById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("dustbins");
  const dustbinObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  console.log(dustbinObj);
  return dustbinObj;
}

async function addDustbin(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("dustbins");
  
  // Convert areaId to ObjectId if provided
  if (obj.areaId && typeof obj.areaId === 'string' && obj.areaId.length === 24) {
    try {
      obj.areaId = ObjectId.createFromHexString(obj.areaId);
    } catch (e) {
      console.log("Invalid areaId format:", obj.areaId);
    }
  }
  
  // Convert assignedDriverId to ObjectId if provided
  if (obj.assignedDriverId && typeof obj.assignedDriverId === 'string' && obj.assignedDriverId.length === 24) {
    try {
      obj.assignedDriverId = ObjectId.createFromHexString(obj.assignedDriverId);
    } catch (e) {
      console.log("Invalid assignedDriverId format:", obj.assignedDriverId);
    }
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

async function updateDustbin(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("dustbins");
  let id = obj._id;
  delete obj._id;
  
  // Convert areaId to ObjectId if provided
  if (obj.areaId && typeof obj.areaId === 'string' && obj.areaId.length === 24) {
    try {
      obj.areaId = ObjectId.createFromHexString(obj.areaId);
    } catch (e) {
      console.log("Invalid areaId format:", obj.areaId);
    }
  }
  
  // Convert assignedDriverId to ObjectId if provided
  if (obj.assignedDriverId && typeof obj.assignedDriverId === 'string' && obj.assignedDriverId.length === 24) {
    try {
      obj.assignedDriverId = ObjectId.createFromHexString(obj.assignedDriverId);
    } catch (e) {
      console.log("Invalid assignedDriverId format:", obj.assignedDriverId);
    }
  }
  
  // Normalize text fields
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return result;
}

async function deleteDustbin(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("dustbins");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};

module.exports = DustbinService = {
  getAllDustbins,
  getDustbinById,
  addDustbin,
  updateDustbin,
  deleteDustbin,
};
