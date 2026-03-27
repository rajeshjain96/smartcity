const { app } = require("../init.js");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;

function dbFromReq(req) {
  if (req && req.app && req.app.locals) {
    if (req.app.locals.db) return req.app.locals.db;
    if (req.app.locals.mongoClient) {
      return req.app.locals.mongoClient.db(process.env.DB_NAME);
    }
  }
  return dbFromApp();
}

function dbFromApp() {
  if (app.locals.db) return app.locals.db;
  return app.locals.mongoClient.db(process.env.DB_NAME);
}

function normalizeUserForClient(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  const activeStatus =
    typeof user.activeStatus === "boolean"
      ? user.activeStatus
      : user.status !== "disabled";
  return { ...rest, activeStatus };
}

async function verifyPassword(plain, stored) {
  if (plain == null || stored == null) return false;
  if (typeof stored === "string" && stored.startsWith("$2")) {
    return bcrypt.compare(String(plain), stored);
  }
  return String(plain) === String(stored);
}

async function hashPasswordIfNeeded(plain) {
  if (plain == null || String(plain).trim() === "") return plain;
  return bcrypt.hash(String(plain), BCRYPT_ROUNDS);
}

async function getAllUsers(req) {
  const db = dbFromReq(req);
  const collection = db.collection("users");

  let list = await collection.find().toArray();

  list = list.map((user) => normalizeUserForClient(user));

  return list;
}

async function getUserById(req, id) {
  const db = dbFromReq(req);
  const collection = db.collection("users");

  const userObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });

  if (userObj) {
    return normalizeUserForClient(userObj);
  }

  return userObj;
}

async function getUserByEmailId(emailId) {
  const db = dbFromApp();
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: emailId,
  });
  if (userObj) {
    return { result: "success" };
  } else {
    return { result: "failed" };
  }
}

async function checkUser(obj) {
  const db = dbFromApp();
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return userObj;
}

async function checkUserTryingToLogIn(obj) {
  const db = dbFromApp();
  const collection = db.collection("users");
  const userObj = await collection.findOne({
    emailId: obj.emailId,
  });
  return userObj;
}

async function addUser(obj) {
  const db = dbFromApp();
  const collection = db.collection("users");
  const copy = { ...obj };
  if (copy.password != null && String(copy.password).trim() !== "") {
    copy.password = await hashPasswordIfNeeded(copy.password);
  }
  let result = await collection.insertOne(copy);
  copy._id = result.insertedId;

  const { password, ...userWithoutPassword } = copy;
  return normalizeUserForClient(userWithoutPassword);
}

async function updateUser(req, obj) {
  const db = dbFromReq(req);
  const collection = db.collection("users");
  let id = obj._id;
  delete obj._id;
  if (obj.status == "forgotPassword") {
    obj.password = "";
  }

  if (obj.activeStatus !== undefined) {
    const v = obj.activeStatus;
    const bool =
      v === true || v === "true" || v === 1 || v === "1";
    obj.activeStatus = bool;
    obj.status = bool ? "active" : "disabled";
  }

  if (
    !obj.password ||
    String(obj.password).trim() === "" ||
    obj.password === "..."
  ) {
    delete obj.password;
  }

  await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );

  const updatedUser = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  if (updatedUser) {
    return normalizeUserForClient(updatedUser);
  }
  return null;
}

async function deleteUser(req, id) {
  const db = dbFromReq(req);
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
  verifyPassword,
};
