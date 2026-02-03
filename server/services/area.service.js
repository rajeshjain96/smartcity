const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllAreas(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("areas");
  let list = await collection.find().toArray();
  return list;
}

async function getAreaById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("areas");
  const areaObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  console.log(areaObj);
  return areaObj;
}

async function addArea(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("areas");
  
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

async function updateArea(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("areas");
  let id = obj._id;
  delete obj._id;
  
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

async function deleteArea(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("areas");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};

module.exports = AreaService = {
  getAllAreas,
  getAreaById,
  addArea,
  updateArea,
  deleteArea,
};
