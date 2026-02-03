const express = require("express");
const router = express.Router();
const FileService = require("../services/file.service");
const path = require("path");
const fs = require("fs");

router.get("/count/:fileName", async (req, res) => {
  let fileName = req.params.fileName;
  console.log(fileName);

  // get no of file names starting with fileName
  res.status(200).json(FileService.countNoOfFiles(fileName));
});
router.get("/downloadActivityLog/:fileName", (req, res) => {
  try {
    let fileName = req.params.fileName;
    const filePath = path.join(__dirname, "..", "logs", fileName);
    // console.log(filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File is not present" });
    }
    // const filePath = path.join(__dirname, "files", "sample.txt");
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.log("Download error:", err);
        res.status(500).send("Error downloading file.");
      }
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});
router.get("/showActivityLog/:fileName", (req, res) => {
  try {
    let fileName = req.params.fileName;
    const filePath = path.join(__dirname, "..", "logs", fileName);
    console.log(filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File is not present" });
    }
    res.sendFile(filePath);
  } catch (err) {
    console.log("Unexpected error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
