const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllDrivers(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  let list = await collection.find().toArray();
  return list;
}

async function getDriverById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  const driverObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  console.log(driverObj);
  return driverObj;
}

async function getDriverByUserId(req, userId) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  const driverObj = await collection.findOne({
    userId: userId,
  });
  return driverObj;
}

async function addDriver(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  
  // normalize text
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  // Ensure activeStatus is boolean
  if (typeof obj.activeStatus === 'string') {
    obj.activeStatus = obj.activeStatus === 'true' || obj.activeStatus === 'Active';
  }
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}

async function updateDriver(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  let id = obj._id;
  delete obj._id;
  
  // Normalize text fields
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  // Ensure activeStatus is boolean
  if (typeof obj.activeStatus === 'string') {
    obj.activeStatus = obj.activeStatus === 'true' || obj.activeStatus === 'Active';
  }
  
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return result;
}

async function deleteDriver(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("drivers");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};

module.exports = DriverService = {
  getAllDrivers,
  getDriverById,
  getDriverByUserId,
  addDriver,
  updateDriver,
  deleteDriver,
};
