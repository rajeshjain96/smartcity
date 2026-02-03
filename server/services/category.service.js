const { app } = require("../init.js");
const { ObjectId } = require("mongodb");
async function getAllCategories() {
  const db = app.locals.db;
  const collection = db.collection("categories");
  let list = await collection.find().toArray();
  return list;
}
async function getCategoryById(id) {
  let obj = await Category.findById(id);
  return obj;
}
async function addCategory(obj) {
  const db = app.locals.db;
  const collection = db.collection("categories");
  let response = await collection.insertOne(obj);
  return obj;
}
async function updateCategory(obj) {
  const db = app.locals.db;
  const collection = db.collection("categories");
  let id = obj._id;
  delete obj._id;
  obj = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  return obj;
}
async function deleteCategory(id) {
  const db = app.locals.db;
  const collection = db.collection("categories");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}
module.exports = CategoryService = {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
};
