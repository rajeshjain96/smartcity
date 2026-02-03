const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllShopDetails(req) {
  const client = req.app.locals.mongoClient;
  // Use tenant database if shopurl is available, otherwise use main database
  const dbName = (req && req.tokenData && req.tokenData.shopurl) 
    ? `homedecor_${req.tokenData.shopurl}` 
    : process.env.DB_NAME;
  const db = client.db(dbName);
  const collection = db.collection("shopDetails");

  let list = await collection.find({}).toArray();

  return list;
}
async function getShopDetailById(req, id) {
  const client = req.app.locals.mongoClient;
  // Use tenant database if shopurl is available, otherwise use main database
  const dbName = (req && req.tokenData && req.tokenData.shopurl) 
    ? `homedecor_${req.tokenData.shopurl}` 
    : process.env.DB_NAME;
  const db = client.db(dbName);
  const collection = db.collection("shopDetails");
  
  let query = {
    _id: ObjectId.createFromHexString(id),
  };
  
  const shopDetailObj = await collection.findOne(query);
  return shopDetailObj;
}
async function addShopDetail(req, obj) {
  const client = req.app.locals.mongoClient;
  // Use tenant database if shopurl is available, otherwise use main database
  const dbName = (req && req.tokenData && req.tokenData.shopurl) 
    ? `homedecor_${req.tokenData.shopurl}` 
    : process.env.DB_NAME;
  const db = client.db(dbName);
  const collection = db.collection("shopDetails");
  
  // Set shopurl from tokenData if not already set
  if (req && req.tokenData && req.tokenData.shopurl && !obj.shopurl) {
    obj.shopurl = req.tokenData.shopurl;
  }
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}
async function updateShopDetail(req, obj) {
  const client = req.app.locals.mongoClient;
  // Use tenant database if shopurl is available, otherwise use main database
  const dbName = (req && req.tokenData && req.tokenData.shopurl) 
    ? `homedecor_${req.tokenData.shopurl}` 
    : process.env.DB_NAME;
  const db = client.db(dbName);
  const collection = db.collection("shopDetails");
  let id = obj._id;
  delete obj._id;
  
  let query = {
    _id: ObjectId.createFromHexString(id),
  };
  
  // Ensure shopurl is not changed during update
  if (req && req.tokenData && req.tokenData.shopurl) {
    obj.shopurl = req.tokenData.shopurl;
  }
  
  await collection.updateOne(
    query,
    { $set: obj }
  );
  
  // Fetch and return updated shop detail
  const updatedShopDetail = await collection.findOne(query);
  if (updatedShopDetail) {
    return updatedShopDetail;
  }
  return null;
}
async function deleteShopDetail(req, id) {
  const client = req.app.locals.mongoClient;
  // Use tenant database if shopurl is available, otherwise use main database
  const dbName = (req && req.tokenData && req.tokenData.shopurl) 
    ? `homedecor_${req.tokenData.shopurl}` 
    : process.env.DB_NAME;
  const db = client.db(dbName);
  const collection = db.collection("shopDetails");
  
  let query = {
    _id: ObjectId.createFromHexString(id),
  };
  
  let obj = await collection.deleteOne(query);
  return obj;
}

module.exports = ShopDetailService = {
  getAllShopDetails,
  getShopDetailById,
  addShopDetail,
  updateShopDetail,
  deleteShopDetail,
};

