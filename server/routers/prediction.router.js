const express = require("express");
const router = express.Router();
const PredictionService = require("../services/prediction.service");

function requireAdmin(req, res, next) {
  if (!req.tokenData || req.tokenData.role !== "admin") {
    return res.status(403).json({ error: "Forbidden. Admin only." });
  }
  next();
}

router.get("/dustbins", requireAdmin, async (req, res, next) => {
  try {
    const data = await PredictionService.getDustbinFillPredictions(req);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
