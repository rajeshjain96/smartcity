const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllShops() {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  let list = await collection.find().toArray();

  return list;
}
async function getShopById(id) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  const shopObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  console.log(shopObj);

  return shopObj;
}
async function getShopByEmailId(emailId) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  const shopObj = await collection.findOne({
    emailId: emailId,
  });
  return shopObj;
}
async function getShopByShopurl(shopurl) {
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  const shopObj = await collection.findOne({
    shopurl: shopurl,
  });
  return shopObj;
}
async function checkShopExists(emailId, shopurl) {
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  
  const existingShop = await collection.findOne({
    $or: [
      { emailId: emailId },
      { shopurl: shopurl }
    ]
  });
  
  if (existingShop) {
    if (existingShop.emailId === emailId && existingShop.shopurl === shopurl) {
      return { exists: true, field: "both", message: "Email ID and Shop URL already exist" };
    } else if (existingShop.emailId === emailId) {
      return { exists: true, field: "emailId", message: "Email ID already exists" };
    } else if (existingShop.shopurl === shopurl) {
      return { exists: true, field: "shopurl", message: "Shop URL already exists" };
    }
  }
  
  return { exists: false };
}
async function addShop(obj) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
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
async function addManyShops(shops) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  const result = await collection.insertMany(shops);
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = await collection
    .find({ _id: { $in: insertedIds } })
    .toArray();
  return insertedDocs;
}
async function updateManyShops(shops) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  // Prepare bulk operations
  const operations = shops.map((shop) => {
    const { _id, ...fieldsToUpdate } = shop;
    return {
      updateOne: {
        filter: { _id: ObjectId.createFromHexString(_id) },
        update: { $set: fieldsToUpdate },
      },
    };
  });
  const result = await collection.bulkWrite(operations);
  const updatedIds = shops.map((p) => ObjectId.createFromHexString(p._id));

  const updatedShops = await collection
    .find({ _id: { $in: updatedIds } })
    .toArray();
  return updatedShops;
}
async function updateShop(obj) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  let id = obj._id;
  delete obj._id;
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return result;
}
async function deleteShop(id) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("shops");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}
normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};
module.exports = ShopService = {
  getAllShops,
  getShopById,
  getShopByEmailId,
  getShopByShopurl,
  checkShopExists,
  addShop,
  addManyShops,
  updateManyShops,
  updateShop,
  deleteShop,
};
