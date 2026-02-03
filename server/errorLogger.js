const logger = require("./logger");
const errorLogger = (err, req, res, next) => {
  const user = req.user?.name || "guest";
  const message = `${user} encountered error during ${req.method} ${req.originalUrl} — ${err.message}`;
  logger.error(message);
  res.status(500).json({ error: "Internal Server Error" });
};
module.exports = errorLogger;
