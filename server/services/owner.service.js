const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllOwners() {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);

  const collection = db.collection("owners");

  let list = await collection.find().toArray();

  return list;
}
async function getOwnerByEmailId(emailId) {
  // const db = app.locals.db;
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  const ownerObj = await collection.findOne({
    emailId: emailId,
  });
  if (ownerObj) {
    return { result: "success" };
  } else {
    return { result: "failed" };
  }
  // return ownerObj;
}
async function checkOwner(obj) {
  // const db = app.locals.db;
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  const ownerObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return ownerObj;
}
async function checkOwnerTryingToLogIn(req,obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  const ownerObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return ownerObj;
}
async function addOwner(obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  let response = await collection.insertOne(obj);
  return obj;
}
async function updateOwner(obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  let id = obj._id;
  delete obj._id;
  if (obj.status == "forgotPassword") {
    obj.password = "";
  }
  obj = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return obj;
}
async function deleteOwner(id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("owners");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}
module.exports = OwnerService = {
  getAllOwners,
  // getOwnerById,
  getOwnerByEmailId,
  checkOwner,
  checkOwnerTryingToLogIn,
  addOwner,
  updateOwner,
  deleteOwner,
};
