const { app } = require("../init.js");
const fs = require("fs");
const { ObjectId } = require("mongodb");

function countNoOfFiles(fileName) {
  const files = fs.readdirSync("./uploads/");
  let filteredFiles = files.filter((e, index) => e.startsWith(fileName));
  return { count: filteredFiles.length };
}
module.exports = FileService = {
  countNoOfFiles,
};
