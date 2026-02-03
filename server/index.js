const { app } = require("./init.js");
const express = require("express");
var cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
var cors = require("cors");
const path = require("path");
const authenticateUser = require("./authenticateUser.js");
const userRouter = require("./routers/user.router.js");
const dustbinRouter = require("./routers/dustbin.router.js");
const areaRouter = require("./routers/area.router.js");
const driverRouter = require("./routers/driver.router.js");
const pickupRequestRouter = require("./routers/pickupRequest.router.js");
const fileRouter = require("./routers/file.router.js");
const specialRouter = require("./routers/special.router.js");
const logger = require("./logger");
const errorLogger = require("./errorLogger");
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
); // allow cookies
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
// Activity logging middleware
app.use(authenticateUser);
app.use(logActivity);
app.use("/api/specials", specialRouter); // authentication not required
app.use("/api/users", userRouter); // authentication done inside this file
app.use("/api/dustbins", dustbinRouter); // authentication done inside this file
app.use("/api/areas", areaRouter); // authentication done inside this file
app.use("/api/drivers", driverRouter); // authentication done inside this file
app.use("/api/pickupRequests", pickupRequestRouter); // authentication done inside this file
app.use("/api/files", fileRouter);
app.use("/api/uploadedImages", express.static(path.join(__dirname, "..", "uploads")));
app.use(errorLogger); // This should be the last middleware.
function logActivity(req, res, next) {
  let log;
  if (req.role == "Forbidden") {
    log =
      `Forbidden operation -->` + req.method + "--->" + req.baseUrl.slice(1);
    logger.warn(log);
    return res.sendStatus(403);
  } else if (req.role == "guest") {
    if (req.method == "GET") {
      log = `Guest -->` + req.method + "--->" + req.baseUrl.slice(1);
    }
  } else if (req.tokenData.role == "user" || req.tokenData.role == "admin") {
    log =
      req.tokenData.role +
      "(" +
      req.tokenData.name +
      ")" +
      "-->" +
      req.method +
      "--->" +
      req.baseUrl +
      req.path;
  }
  logger.warn(log);
  next();
}
function checkAuthority(req, res, next) {
  if (!req.tokenData || req.tokenData.role == "guest") {
    // assuming you set req.user after authentication
    res.status(401).json({ message: "Unauthorized" });
  } else {
    next(); // allow
  }
}
