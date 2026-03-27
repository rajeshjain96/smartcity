const express = require("express");
const router = express.Router();
const ReportsService = require("../services/reports.service");

function requireAdmin(req, res, next) {
  if (!req.tokenData || req.tokenData.role !== "admin") {
    return res.status(403).json({ error: "Forbidden. Admin only." });
  }
  next();
}

router.get("/status-summary", requireAdmin, async (req, res, next) => {
  try {
    const data = await ReportsService.getStatusSummary(req);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/area-summary", requireAdmin, async (req, res, next) => {
  try {
    const data = await ReportsService.getAreaSummary(req);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/driver-performance", requireAdmin, async (req, res, next) => {
  try {
    const data = await ReportsService.getDriverPerformance(req);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get("/monthly-trend", requireAdmin, async (req, res, next) => {
  try {
    const data = await ReportsService.getMonthlyTrend(req);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
