// Load environment variables based on NODE_ENV
require("./config/env.js");

const express = require("express");
const { MongoClient } = require("mongodb");
// const mongodb = require("mongodb");
// const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(process.env.MONGODB_URL);
let db;
const app = express();

async function connectToDatabase(retries = 3, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      // app.locals.db = client.db(process.env.DB_NAME);
      app.locals.mongoClient = client;
      console.log("Database connected successfully...");
      app.listen(process.env.PORT, () => {
        console.log("Server started at port number ..." + process.env.PORT);
      });
      return;
    } catch (err) {
      const errorMessage = err.message || err.toString();
      
      // Check for specific connection errors
      if (errorMessage.includes("ECONNREFUSED")) {
        console.error(`\n❌ MongoDB Connection Refused (Attempt ${i + 1}/${retries})`);
        console.error(`Error: ${errorMessage}`);
        console.error(`\n⚠️  This usually means:`);
        console.error(`   1. Your IP address is not whitelisted on the MongoDB server`);
        console.error(`   2. The MongoDB server is not accessible from your network`);
        console.error(`   3. Firewall rules are blocking the connection`);
        console.error(`\n💡 Solution:`);
        console.error(`   - Find your current public IP address`);
        console.error(`   - Add it to the MongoDB server's IP whitelist`);
        console.error(`   - If using MongoDB Atlas, go to Network Access and add your IP`);
        console.error(`   - If using a self-hosted MongoDB, check firewall/iptables rules\n`);
      } else if (errorMessage.includes("authentication failed") || errorMessage.includes("Authentication failed")) {
        console.error(`\n❌ MongoDB Authentication Failed (Attempt ${i + 1}/${retries})`);
        console.error(`Error: ${errorMessage}`);
        console.error(`\n⚠️  Check your MongoDB credentials in the .env file\n`);
      } else {
        console.error(`\n❌ MongoDB Connection Error (Attempt ${i + 1}/${retries})`);
        console.error(`Error: ${errorMessage}\n`);
      }
      
      // If not the last retry, wait before retrying
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`\n❌ Failed to connect to MongoDB after ${retries} attempts.`);
        console.error(`Server will not start without database connection.\n`);
        process.exit(1);
      }
    }
  }
}

connectToDatabase();

module.exports = { app };
