const express = require("express");
const router = express.Router();
const ProductService = require("../services/product.service");
const multer = require("multer");
// const upload = multer({ dest: "uploads/" });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
router.get("/", async (req, res) => {
  let list = await ProductService.getAllProducts();
  res.status(200).json(list);
});
router.get("/:id", async (req, res) => {
  let id = req.params.id;
  res.send(ProductService.getProductById(id));
});
router.post("/", async (req, res) => {
  let obj = req.body;
  obj.lastModified = new Date();
  obj.lastUpdated = new Date();
  obj = await ProductService.addProduct(obj);
  res.status(201).json(obj);
});
router.put("/", upload.single("image_file"), async (req, res) => {
  let obj = req.body;
  obj.updateDate = new Date();
  obj = await ProductService.updateProduct(obj);
  res.status(200).json(obj);
});
router.delete("/:id", async (req, res) => {
  let id = req.params.id;
  let obj = req.body;
  obj = await ProductService.deleteProduct(id);
  res.json(obj);
});

module.exports = router;
