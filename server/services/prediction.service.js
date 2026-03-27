const { ObjectId } = require("mongodb");

/** Rolling window for counting pickup requests per dustbin (days). */
const DEFAULT_WINDOW_DAYS = 14;
/** Request counts in window → risk tier (simple frequency heuristic). */
const HIGH_THRESHOLD = 8;
const MEDIUM_THRESHOLD = 4;

/**
 * Simple fill-risk demo: high recent pickup frequency at a dustbin suggests
 * it may fill soon (operational proxy, not a trained model).
 */
async function getDustbinFillPredictions(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const pickupCol = db.collection("pickupRequests");
  const dustbinsCol = db.collection("dustbins");
  const areasCol = db.collection("areas");

  const windowDays =
    parseInt(process.env.PREDICTION_WINDOW_DAYS, 10) || DEFAULT_WINDOW_DAYS;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const counts = await pickupCol
    .aggregate([
      {
        $match: {
          addDate: { $gte: cutoff },
          dustbinId: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$dustbinId", requestCount: { $sum: 1 } } },
    ])
    .toArray();

  const countMap = new Map();
  counts.forEach((row) => {
    const key = row._id && row._id.toString ? row._id.toString() : String(row._id);
    countMap.set(key, row.requestCount);
  });

  const allDustbins = await dustbinsCol.find({}).toArray();
  const areaIdSet = new Set();
  allDustbins.forEach((d) => {
    if (d.areaId) {
      const k = d.areaId.toString ? d.areaId.toString() : String(d.areaId);
      if (k && k.length === 24) areaIdSet.add(k);
    }
  });

  const areaObjectIds = [];
  areaIdSet.forEach((id) => {
    try {
      areaObjectIds.push(ObjectId.createFromHexString(id));
    } catch {
      /* skip */
    }
  });

  const areas =
    areaObjectIds.length > 0
      ? await areasCol.find({ _id: { $in: areaObjectIds } }).toArray()
      : [];
  const areaMap = new Map();
  areas.forEach((a) => {
    areaMap.set(a._id.toString(), a.areaName || "N/A");
  });

  const results = allDustbins.map((d) => {
    const idStr = d._id.toString();
    const requestCount = countMap.get(idStr) || 0;
    let riskLevel = "Low";
    if (requestCount >= HIGH_THRESHOLD) riskLevel = "High";
    else if (requestCount >= MEDIUM_THRESHOLD) riskLevel = "Medium";

    const areaKey = d.areaId
      ? d.areaId.toString
        ? d.areaId.toString()
        : String(d.areaId)
      : "";
    const areaName = areaKey ? areaMap.get(areaKey) || "N/A" : "N/A";

    return {
      dustbinId: idStr,
      dustbinName: d.binName || "N/A",
      areaName,
      riskLevel,
      requestCount,
      windowDays,
    };
  });

  const tierOrder = { High: 0, Medium: 1, Low: 2 };
  results.sort((a, b) => {
    const t = tierOrder[a.riskLevel] - tierOrder[b.riskLevel];
    if (t !== 0) return t;
    return b.requestCount - a.requestCount;
  });

  return results;
}

module.exports = {
  getDustbinFillPredictions,
};
