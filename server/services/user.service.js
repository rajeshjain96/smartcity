const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllUsers(req) {
  // const db = app.locals.db;
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");

  let list = await collection.find().toArray();
  
  // Remove password from all users before returning
  list = list.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  return list;
}
async function getUserById(req, id) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  
  const userObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  
  // Remove password before returning
  if (userObj) {
    const { password, ...userWithoutPassword } = userObj;
    return userWithoutPassword;
  }
  
  return userObj;

  // let obj = await User.findById(id);
  // return obj;
}
async function getUserByEmailId(emailId) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: emailId,
  });
  if (userObj) {
    return { result: "success" };
  } else {
    return { result: "failed" };
  }
  // return userObj;
}
async function checkUser(obj) {
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return userObj;
}
async function checkUserTryingToLogIn(obj) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return userObj;
}
async function addUser(obj) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  
  // Remove password before returning
  const { password, ...userWithoutPassword } = obj;
  return userWithoutPassword;
}
async function updateUser(req, obj) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  let id = obj._id;
  delete obj._id;
  if (obj.status == "forgotPassword") {
    obj.password = "";
  }
  
  // If password is empty or not provided, don't update it (keep existing password)
  if (!obj.password || obj.password.trim() === "" || obj.password === "...") {
    delete obj.password;
  }
  
  await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  
  // Fetch and return updated user without password
  const updatedUser = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  if (updatedUser) {
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
  return null;
}
async function deleteUser(req, id) {
  // const db = app.locals.db;
  const client = app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("users");
  
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}
module.exports = UserService = {
  getAllUsers,
  getUserById,
  getUserByEmailId,
  checkUser,
  checkUserTryingToLogIn,
  addUser,
  updateUser,
  deleteUser,
};
