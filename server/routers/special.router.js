// Load environment variables based on NODE_ENV
require("../config/env.js");

const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const logger = require("../logger");

router.get("/welcome", async (req, res, next) => {
  // check whether session is assigned or not
  let token = req.cookies.token;
  if (!token) {
    // assign session/token
    let obj = { role: "guest", name: "guest" };
    token = jwt.sign(obj, process.env.SECRET_KEY, { expiresIn: "1h" });
    res.cookie("token", token, {
      httpOnly: true,
      // secure: false, // Set to true in production with HTTPS
      secure: true, // Set to true in production with HTTPS
      sameSite: "Lax",
      maxAge: 3600000,
    });
    res.json({ role: "new" });
  } else {
    // check whether user is already logged in
    // so first get tokenData
    jwt.verify(token, process.env.SECRET_KEY, (err, tokenData) => {
      if (err) {
        // There might be tempering with the token... but before responding let us add to log
        req.activity = "Forbidden";
        next();
        return;
      }
      if (tokenData.role == "guest") {
        // Guest is trying to do the things illegally
        // but before responding let us add to log
        res.json(tokenData);
      } else {
        console.log("Oh...Valid user refreshed the page");
        // Not guest, so may be admin, or other staff
        res.json(tokenData);
      }
    });
  }
});
function logActivity(req, res, next) {
  if (req.activity == "Unauthorized") {
    logger.warn(
      `Unauthorized operation -->` + req.method + "--->" + req.baseUrl.slice(1)
    );
    return res.sendStatus(401);
  } else if (req.activity == "Forbidden") {
    logger.warn(
      `Forbidden woperation -->` + req.method + "--->" + req.baseUrl.slice(1)
    );
    return res.sendStatus(403);
  } else if (req.activity == "guestActivity") {
    logger.warn(
      `Guest's illegal operation -->` +
        req.method +
        "--->" +
        req.baseUrl.slice(1)
    );
    return res.sendStatus(401); // Unauthorized
  }
  logger.info(
    req.tokenData.name + "-->" + req.method + "--->" + req.baseUrl.slice(1)
  );
  next();
}

module.exports = router;
