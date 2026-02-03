const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllRates(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("rates");

  let query = {};
  let list = await collection.find(query).toArray();

  return list;
}
async function getRateById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("rates");
  
  const rateObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return rateObj;
}
async function addRate(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("rates");
  
  // Set shopurl from tokenData if not already set
  if (req && req.tokenData && req.tokenData.shopurl && !obj.shopurl) {
    obj.shopurl = req.tokenData.shopurl;
  }
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}
async function updateRate(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("rates");
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
async function deleteRate(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("rates");
  
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

module.exports = RateService = {
  getAllRates,
  getRateById,
  addRate,
  updateRate,
  deleteRate,
};

