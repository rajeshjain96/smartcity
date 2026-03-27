const STATUS_ORDER = ["Pending", "Assigned", "InProgress", "Collected"];

function getDb(req) {
  const client = req.app.locals.mongoClient;
  return client.db(process.env.DB_NAME);
}

async function getStatusSummary(req) {
  const db = getDb(req);
  const col = db.collection("pickupRequests");
  const rows = await col
    .aggregate([
      { $match: { status: { $in: STATUS_ORDER } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ])
    .toArray();
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return STATUS_ORDER.map((status) => ({
    status,
    count: map.get(status) || 0,
  }));
}

async function getAreaSummary(req) {
  const db = getDb(req);
  const col = db.collection("pickupRequests");
  return col
    .aggregate([
      { $match: { areaId: { $exists: true, $ne: null } } },
      { $group: { _id: "$areaId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "areas",
          localField: "_id",
          foreignField: "_id",
          as: "area",
        },
      },
      { $unwind: { path: "$area", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          areaName: { $ifNull: ["$area.areaName", "Unknown"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();
}

async function getDriverPerformance(req) {
  const db = getDb(req);
  const col = db.collection("pickupRequests");
  return col
    .aggregate([
      {
        $match: {
          status: "Collected",
          assignedDriverId: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$assignedDriverId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "drivers",
          localField: "_id",
          foreignField: "_id",
          as: "driver",
        },
      },
      { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          driverName: { $ifNull: ["$driver.driverName", "Unknown"] },
          count: 1,
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray();
}

async function getMonthlyTrend(req) {
  const db = getDb(req);
  const col = db.collection("pickupRequests");
  const rows = await col
    .aggregate([
      { $match: { addDate: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            y: { $year: "$addDate" },
            m: { $month: "$addDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ])
    .toArray();

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return rows.map((r) => ({
    period: `${monthNames[r._id.m - 1]} ${r._id.y}`,
    year: r._id.y,
    month: r._id.m,
    count: r.count,
  }));
}

module.exports = {
  getStatusSummary,
  getAreaSummary,
  getDriverPerformance,
  getMonthlyTrend,
};
