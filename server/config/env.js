const dotenv = require("dotenv");
const path = require("path");

// Load .env file
const result = dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

if (result.error) {
  console.warn(`Warning: Could not load .env file. Error: ${result.error.message}`);
} else {
  console.log(`Loaded environment variables from .env file`);
}

module.exports = {};

