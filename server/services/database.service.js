const { MongoClient } = require("mongodb");

const BASE_URI = process.env.MONGODB_URL; // mongodb://localhost:27017

async function createTenantDatabase(dbName) {
  const client = new MongoClient(BASE_URI);
  await client.connect();
  const db = client.db(dbName);
  // 👇 Insert first document (this creates DB)
  await db.collection("settings").insertOne({
    dbName,
    createdAt: new Date(),
    currency: "INR",
    active: true
  });
  console.log(`Database created: ${dbName}`);
  await client.close();
  return dbName;
}

module.exports = DatabaseService = {createTenantDatabase};
