const express = require("express");
const router = express.Router();
const ShopService = require("../services/shop.service");
const UserService = require("../services/user.service");
const DatabaseService = require("../services/database.service");

const { sendOTPEmail, sendResetOTPEmail } = require("../utils/mailer");
const multer = require("multer");
const { normalizeNewlines } = require("../utilities/lib");
// import crypto from "crypto";
const crypto = require("crypto");
const { log } = require("winston");

// const upload = multer({ dest: "uploads/" });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });
router.get("/", async (req, res, next) => {
  try {
    let list = await ShopService.getAllShops();
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/byEmailId/:emailId", async (req, res, next) => {
  try {
    let emailId = req.params.emailId;
    let obj = await ShopService.getShopByEmailId(emailId);
    if (obj) {
      res.status(200).json(obj);
    } else {
      res.status(404).json({ error: "Email ID not found" });
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await ShopService.getShopById(id);
    res.send(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.post("/", upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    // normalize text
    const keys = Object.keys(obj);
    for (let key of keys) {
      if (typeof obj[key] == "string") {
        obj[key] = normalizeNewlines(obj[key]);
      }
    }
    // Check if emailId or shopurl already exists
    const checkResult = await ShopService.checkShopExists(obj.emailId, obj.shopurl);
    if (checkResult.exists) {
      return res.status(409).json({ error: checkResult.message });
    }
    obj.addDate = new Date();
    obj.updateDate = new Date();
    obj = await ShopService.addShop(obj);
    // create an entry in user table - emailId, password: randomly generated, role:admin, status: waiting
    let userObj = {};
    userObj.emailId = obj.emailId;
    userObj.shopurl = obj.shopurl;
    userObj.name = obj.shopowner;
    userObj.password = crypto.randomInt(100000, 1000000).toString();
    userObj.role = "admin";
    userObj.status = "enabled";
    
    // Store password temporarily for email before removing it
    const tempPassword = userObj.password;
    
    userObj = await UserService.addUser(userObj);
    console.log(userObj);
    
    // Send password to user via email
    try {
      await sendOTPEmail(userObj.emailId, tempPassword);
      console.log(`Password email sent to ${userObj.emailId}`);
    } catch (emailError) {
      console.error("Error sending password email:", emailError);
      // Don't fail the shop creation if email fails, but log it
    }
    // then send an email
    // now create a database homedecor_shopurl
    await DatabaseService.createTenantDatabase("homedecor_" + userObj.shopurl);
    
    // Create default rates record for the new tenant
    const RateService = require("../services/rate.service");
    const rateObj = {
      perPlateStitchingRate: 0,
      perSqFtStitchingRate: 0,
      blindsPerSqFtRate: 0,
      astarStitchingRate: 0,
      trackRatePerRunningFeet: 0,
      shopurl: userObj.shopurl,
      addDate: new Date(),
      updateDate: new Date()
    };
    // Create a mock req object with tokenData for RateService
    const mockReq = {
      app: req.app,
      tokenData: { shopurl: userObj.shopurl }
    };
    await RateService.addRate(mockReq, rateObj);
    
    // Create default shopDetails record for the new tenant
    const ShopDetailService = require("../services/shopDetail.service");
    const shopDetailObj = {
      shopName: obj.shopName || obj.shopname || "",
      address: obj.address || "",
      mobileNumber: obj.mobileNumber || obj.mobilenumber || "",
      emailId: obj.emailId || obj.emailid || "",
      ownerName: obj.shopowner || obj.ownerName || "",
      gstNumber: obj.gstNumber || obj.gstnumber || "",
      logo: obj.logo || "",
      shopurl: userObj.shopurl,
      addDate: new Date(),
      updateDate: new Date(),
      updatedBy: ""
    };
    await ShopDetailService.addShopDetail(mockReq, shopDetailObj);
    
    res.status(201).json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.post("/bulk-add", upload.any(), async (req, res, next) => {
  let shops = req.body;
  if (!Array.isArray(shops)) {
    return res.status(400).json({ message: "Invalid input, expected array" });
  }
  shops.forEach((e, index) => {
    e.addDate = new Date();
    e.updateDate = new Date();
  });
  try {
    let result = await ShopService.addManyShops(shops);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.put("/", upload.any(), async (req, res, next) => {
  try {
    let obj = req.body;
    obj.updateDate = new Date();
    let id = obj._id;
    let result = await ShopService.updateShop(obj);
    if (result.modifiedCount == 1) {
      obj._id = id;
      res.status(200).json(obj);
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.put("/bulk-update", upload.any(), async (req, res, next) => {
  let shops = req.body;
  if (!Array.isArray(shops)) {
    return res.status(400).json({ message: "Invalid input, expected array" });
  }
  shops.forEach((e, index) => {
    e.updateDate = new Date();
  });
  try {
    let result = await ShopService.updateManyShops(shops);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.delete("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = req.body;
    obj = await ShopService.deleteShop(id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});

module.exports = router;
