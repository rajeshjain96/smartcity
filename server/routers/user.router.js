const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserService = require("../services/user.service");
const multer = require("multer");
const logger = require("../logger");
const ms = require("ms");
const crypto = require("crypto");
const { sendOTPEmail } = require("../utils/mailer");
const { ObjectId } = require("mongodb");
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
router.get("/", allowToAdminOnly, async (req, res, next) => {
  try {
    let list = await UserService.getAllUsers(req);
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
router.get("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    res.send(await UserService.getUserById(req, id));
  } catch (error) {
    next(error); // Send error to middleware
  }
});
router.get("/byEmailId/:emailId", async (req, res, next) => {
  try {
    let emailId = req.params.emailId;
    res.status(200).json(await UserService.getUserByEmailId(emailId));
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
      
      // Check if user with this emailId already exists
      const client = req.app.locals.mongoClient;
      const db = client.db(process.env.DB_NAME);
      const collection = db.collection("users");
      const existingUser = await collection.findOne({
        emailId: obj.emailId,
      });
      if (existingUser) {
        return res.status(409).json({ error: "User with this email ID already exists." });
      }
      
      // Generate a random 6-digit password
      obj.password = crypto.randomInt(100000, 1000000).toString();
      obj.addDate = new Date();
      obj.updateDate = new Date();
      
      // Store password temporarily for email before calling addUser (which removes it)
      const tempPassword = obj.password;
      const userEmailId = obj.emailId;
      
      obj = await UserService.addUser(obj);
      
      // Send password to user via email
      try {
        await sendOTPEmail(userEmailId, tempPassword);
        console.log(`Password email sent to ${userEmailId}`);
      } catch (emailError) {
        console.error("Error sending password email:", emailError);
        // Don't fail the user creation if email fails, but log it
      }
      
      // Password is already removed by addUser service, just return the user
      res.status(201).json(obj);
    } catch (error) {
      next(error); // Send error to middleware
    }
  }
);
router.post("/signup", async (req, res, next) => {
  try {
    let obj = req.body;
    let userObj = await UserService.checkUser(obj);
    if (!userObj) {
      // user is not registered, add to database with role as resident (default for signup)
      obj.role = obj.role || "resident"; // Allow role to be set, default to resident
      obj.addDate = new Date();
      obj.updateDate = new Date();
      await UserService.addUser(obj);
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
    let userObj = await UserService.checkUserTryingToLogIn(obj);
    if (!userObj) {
      // No such user
      res.status(409).json({ error: "Wrong emailId" });
    } else if (userObj.status == "disabled") {
      res.status(403).json({ error: "Contact Admin." });
    } else if (userObj.password == "") {
      //First time login by user, he/she needs to signup first
      res.status(403).json({ error: "Signup First" });
    } else if (userObj.password != obj.password) {
      // wrong password
      res.status(403).json({ error: "Wrong password" });
    } else if (userObj.password === obj.password) {
      // Create clean JWT payload with ONLY: userId, name, role
      const jwtPayload = {
        userId: userObj._id.toString(),
        name: userObj.name || "",
        role: userObj.role || "resident"
      };
      
      // Prepare user object for client (without password and sensitive fields)
      const userForClient = {
        _id: userObj._id,
        name: userObj.name,
        emailId: userObj.emailId,
        role: userObj.role,
        status: userObj.status
      };
      
      console.log(
        "Logged in success.. " + userObj.emailId + " " + userObj.role
      );
      
      // Create JWT token with clean payload
      const token = jwt.sign(jwtPayload, process.env.SECRET_KEY, {
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
        .json({ user: userForClient, message: "Logged in Successfully" });
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
      // Add updatedBy field with user's name if available
      if (req.tokenData && req.tokenData.name) {
        obj.updatedBy = req.tokenData.name;
      }
      obj = await UserService.updateUser(req, obj);
      res.status(200).json(obj);
    } catch (error) {
      next(error); // Send error to middleware
    }
  }
);
router.delete("/:id", allowToAdminOnly, async (req, res, next) => {
  try {
    let id = req.params.id;
    let obj = await UserService.deleteUser(req, id);
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
    req.tokenData.role == "user"
  ) {
    // assuming you set req.user after authentication
    res.status(401).json({ message: "Unauthorized" });
  } else if (req.tokenData.role == "admin") {
    next(); // allow
  } else {
    res.status(401).json({ message: "OOPs...Some Error.." });
  }
}
module.exports = router;
