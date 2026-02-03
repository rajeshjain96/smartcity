const jwt = require("jsonwebtoken");
module.exports = function autheticateUser(req, res, next) {

  const token = req.cookies.token;
 
  if (!token) {
    // This is guest
    req.role = "guest";
    next();
    return; /*Important */
  }
  jwt.verify(token, process.env.SECRET_KEY, (err, tokenData) => {
    if (err) {
      // There might be tempering with the token... but before responding let us add to log
      req.activity = "Forbidden";
      next();
      return;
      // return res.sendStatus(403); // Forbidden
    }
    if (tokenData.role == "guest") {
      // Guest is trying to do the things illegally
      // but before responding let us add to log
      req.activity = "guestActivity";
      next();
      return;
      // return res.sendStatus(401); // Unauthorized
    }
    // token seems to be of valid logged-in user
    req.tokenData = tokenData; // Attach user info to request
   
    next();
  });
};
