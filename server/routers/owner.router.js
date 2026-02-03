const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const OwnerService = require("../services/owner.service");
const multer = require("multer");
const logger = require("../logger");
const ms = require("ms");
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
router.get("/", allowToAdminOnly, async (req, res) => {
  try {
    let list = await OwnerService.getAllOwners();
    res.status(200).json(list);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/hello", async (req, res, next) => {
  const token = req.cookies.token;
  try {
    if (!token) {
      res.status(200).json("");
    } else {
      jwt.verify(token, process.env.SECRET_KEY, (err, tokenData) => {
        if (err) {
          next(err);
          return;
        } else {
          // Don't return guest tokens as valid users - they should login
          if (tokenData.role === "guest") {
            res.status(200).json("");
          } else {
            res.status(200).json(tokenData);
          }
        }
      });
    }
    // let list = await StudentService.getAllStudents();
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    res.send(await OwnerService.getOwnerById(id));
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/byEmailId/:emailId", async (req, res, next) => {
  try {
    let emailId = req.params.emailId;
    res.status(200).json(await OwnerService.getOwnerByEmailId(emailId));
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.post(
  "/",

  allowToAdminOnly,
  upload.single("file"),
  async (req, res, next) => {
    try {
      let obj = req.body;
      obj.password = "";
      obj.addDate = new Date();
      obj.updateDate = new Date();
      obj = await OwnerService.addOwner(obj);
      res.status(201).json(obj);
    } catch (error) {
      next(error); // Send error to middleware
    }
  }
);
router.post("/signup", async (req, res, next) => {
  try {
    let obj = req.body;
    let ownerObj = await OwnerService.checkOwner(obj);
    if (!ownerObj) {
      // owner is not registered, add to database with role as owner
      obj.role = "staff";
      obj.status = "waiting";
      OwnerService.addOwner(obj);
      res.status(201).json({ message: "Signup Operation Successful" });
    } //if
    else {
      res.status(409).json({ error: "This emailid is already registered" });
    }
  } catch (error) {
    //try
    next(error); // Send error to middleware
  }
});
router.post("/signout", async (req, res, next) => {
  // delete the token
  try {
    res.clearCookie("token"); //
    res.status(200).json({ result: "Signed out" });
  } catch (error) {
    next(error); // Send error to middleware
  }
});
/*
Use 400 if request is missing/invalid.
Use 401 if the client didn’t provide valid authentication.
Use 403 if they’re authenticated but don’t have permission.
Use 404 if the thing they’re looking for doesn’t exist.
Use 409 for duplicate/unique constraint errors.
Use 422 for validation errors.
*/
router.post("/login", async (req, res, next) => {
  try {
    let obj = req.body;
    let ownerObj = await OwnerService.checkOwnerTryingToLogIn(req,obj);
    if (!ownerObj) {
      // No such owner
      res.status(409).json({ error: "Wrong emailId" });
    } else if (ownerObj.status == "disabled") {
      res.status(403).json({ error: "Contact Admin." });
    } else if (ownerObj.password == "") {
      //First time login by owner, he/she needs to signup first
      res.status(403).json({ error: "Signup First" });
    } else if (ownerObj.password != obj.password) {
      // wrong password
      res.status(403).json({ error: "Wrong password" });
    } else if (ownerObj.password === obj.password) {
      // send owner to client
      ownerObj.password = "...";
      console.log(
        "Logged in success.. " + ownerObj.emailId + " " + ownerObj.role
      );
      // if successful login, assign token
      const token = jwt.sign(ownerObj, process.env.SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRY,
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // Set to true in production with HTTPS
        sameSite: "Lax",
        maxAge: ms(process.env.JWT_EXPIRY),
      });
      res
        .status(201)
        .json({ user: ownerObj, message: "Logged in Successfully" });
    }
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.put(
  "/",
  allowToAdminOnly,
  upload.single("file"),
  async (req, res, next) => {
    try {
      let obj = req.body;
      obj.updateDate = new Date();
      obj = await OwnerService.updateOwner(obj);
      res.status(200).json(obj);
    } catch (error) {
      next(error); // Send error to middleware
    }
  }
);
router.delete("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    obj = await OwnerService.deleteOwner(id);
    res.json(obj);
  } catch (error) {
    next(error); // Send error to middleware
  }
});
//================
function allowToAdminOnly(req, res, next) {
  if (
    !req.tokenData ||
    req.tokenData.role == "guest" ||
    req.tokenData.role == "owner"
  ) {
    // assuming you set req.owner after authentication
    res.status(401).json({ message: "Unauthorized" });
  } else if (req.tokenData.role == "admin") {
    next(); // allow
  } else {
    res.status(401).json({ message: "OOPs...Some Error.." });
  }
}
module.exports = router;
