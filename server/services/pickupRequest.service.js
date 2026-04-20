const { app } = require("../init.js");
const { ObjectId } = require("mongodb");
const path = require("path");
const { detectGarbageLevel } = require("./garbageLevelDetection.service");

const uploadDir = path.resolve(__dirname, "..", "..", "uploads");

async function retryAiDetectionForList(req, list) {
  if (!Array.isArray(list) || list.length === 0) return list;
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");

  // Limit retries per request list fetch to avoid slowing responses
  const candidates = list.filter(
    (r) => r && r.requestImage && !r.detectedLevel
  );
  const toRetry = candidates.slice(0, 5);

  await Promise.all(
    toRetry.map(async (r) => {
      try {
        const imgPath = path.join(uploadDir, r.requestImage);
        const detection = await detectGarbageLevel(imgPath);
        if (detection && detection.status) {
          await collection.updateOne(
            { _id: r._id },
            { $set: { detectedLevel: detection.status }, $unset: { detectionError: "" } }
          );
          r.detectedLevel = detection.status;
          delete r.detectionError;
        } else if (detection && detection.error) {
          // Keep last error, but don't fail the request list
          await collection.updateOne(
            { _id: r._id },
            { $set: { detectionError: detection.error } }
          );
          r.detectionError = detection.error;
        }
      } catch (e) {
        // swallow
      }
    })
  );

  return list;
}

// Helper function to enrich pickup requests with area and dustbin names
async function enrichPickupRequests(req, list) {
  if (!list || list.length === 0) {
    return list;
  }
  
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const areaCollection = db.collection("areas");
  const dustbinCollection = db.collection("dustbins");
  
  // Collect unique areaIds and dustbinIds
  const areaIds = new Set();
  const dustbinIds = new Set();
  
  list.forEach(request => {
    if (request.areaId) {
      const areaIdStr = request.areaId.toString ? request.areaId.toString() : String(request.areaId);
      areaIds.add(areaIdStr);
    }
    if (request.dustbinId) {
      const dustbinIdStr = request.dustbinId.toString ? request.dustbinId.toString() : String(request.dustbinId);
      dustbinIds.add(dustbinIdStr);
    }
  });
  
  // Convert to ObjectId arrays for MongoDB query
  const areaObjectIds = [];
  const dustbinObjectIds = [];
  
  areaIds.forEach(id => {
    try {
      if (id.length === 24) {
        areaObjectIds.push(ObjectId.createFromHexString(id));
      }
    } catch (e) {
      // Skip invalid ObjectIds
    }
  });
  
  dustbinIds.forEach(id => {
    try {
      if (id.length === 24) {
        dustbinObjectIds.push(ObjectId.createFromHexString(id));
      }
    } catch (e) {
      // Skip invalid ObjectIds
    }
  });
  
  // Fetch all areas and dustbins in parallel
  const [areas, dustbins] = await Promise.all([
    areaObjectIds.length > 0 ? areaCollection.find({ _id: { $in: areaObjectIds } }).toArray() : [],
    dustbinObjectIds.length > 0 ? dustbinCollection.find({ _id: { $in: dustbinObjectIds } }).toArray() : []
  ]);
  
  // Create lookup maps (using string keys for comparison)
  const areaMap = new Map();
  areas.forEach(area => {
    const key = area._id.toString ? area._id.toString() : String(area._id);
    areaMap.set(key, area.areaName);
  });
  
  const dustbinMap = new Map();
  dustbins.forEach(dustbin => {
    const key = dustbin._id.toString ? dustbin._id.toString() : String(dustbin._id);
    dustbinMap.set(key, dustbin.binName);
  });
  
  // Enrich each request
  list = list.map(request => {
    const enriched = { ...request };
    
    if (request.areaId) {
      const areaIdKey = request.areaId.toString ? request.areaId.toString() : String(request.areaId);
      enriched.areaName = areaMap.get(areaIdKey) || "N/A";
    } else {
      enriched.areaName = "N/A";
    }
    
    if (request.dustbinId) {
      const dustbinIdKey = request.dustbinId.toString ? request.dustbinId.toString() : String(request.dustbinId);
      enriched.dustbinName = dustbinMap.get(dustbinIdKey) || "N/A";
    } else {
      enriched.dustbinName = "N/A";
    }
    
    return enriched;
  });

  // Best-effort AI retry so existing requests update once Flask comes online
  list = await retryAiDetectionForList(req, list);

  return list;
}

/** Emit only to the resident (users collection id) who owns this pickup. */
async function emitPickupStatusUpdatedToResident(req, pickupRequestIdStr) {
  const io = req.app.get("io");
  if (!io) return;
  const enriched = await getPickupRequestById(req, pickupRequestIdStr);
  if (!enriched || !enriched.userId) return;
  const st = enriched.status;
  if (st !== "InProgress" && st !== "Collected") return;
  const residentUserId = enriched.userId.toString
    ? enriched.userId.toString()
    : String(enriched.userId);
  if (!/^[a-f0-9]{24}$/i.test(residentUserId)) return;
  io.to(`resident:${residentUserId}`).emit("pickupStatusUpdated", {
    requestId: enriched._id.toString(),
    status: enriched.status,
    dustbinName: enriched.dustbinName || "N/A",
  });
}

/** Emit only to the socket room for this driver document _id (matches assignedDriverId on pickups). */
async function emitPickupAssignedToDriver(req, pickupRequestIdStr) {
  const io = req.app.get("io");
  if (!io) return;
  const enriched = await getPickupRequestById(req, pickupRequestIdStr);
  if (!enriched || !enriched.assignedDriverId) return;
  const driverRoomId = enriched.assignedDriverId.toString();
  io.to(`driver:${driverRoomId}`).emit("pickupAssignedToDriver", {
    requestId: enriched._id.toString(),
    areaName: enriched.areaName || "N/A",
    dustbinName: enriched.dustbinName || "N/A",
  });
}

async function getAllPickupRequests(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  let list = await collection.find().toArray();
  // Enrich with area and dustbin names
  list = await enrichPickupRequests(req, list);
  return list;
}

async function getPickupRequestsByUserId(req, userId) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  let list = await collection.find({ userId: userId }).toArray();
  // Enrich with area and dustbin names
  list = await enrichPickupRequests(req, list);
  return list;
}

async function getPickupRequestsByDriverId(req, driverId) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  
  // Convert string to ObjectId if needed
  let driverObjectId = driverId;
  if (typeof driverId === 'string' && driverId.length === 24) {
    try {
      driverObjectId = ObjectId.createFromHexString(driverId);
    } catch (e) {
      console.log("Invalid driverId format:", driverId);
    }
  }
  
  let list = await collection.find({ assignedDriverId: driverObjectId }).toArray();
  // Enrich with area and dustbin names
  list = await enrichPickupRequests(req, list);
  return list;
}

async function getPickupRequestById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  const requestObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  if (requestObj) {
    // Enrich with area and dustbin names
    const enriched = await enrichPickupRequests(req, [requestObj]);
    return enriched[0];
  }
  return requestObj;
}

async function addPickupRequest(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  
  // Convert dustbinId to ObjectId if provided
  if (obj.dustbinId && typeof obj.dustbinId === 'string' && obj.dustbinId.length === 24) {
    try {
      obj.dustbinId = ObjectId.createFromHexString(obj.dustbinId);
    } catch (e) {
      console.log("Invalid dustbinId format:", obj.dustbinId);
    }
  }
  
  // Convert areaId to ObjectId if provided
  if (obj.areaId && typeof obj.areaId === 'string' && obj.areaId.length === 24) {
    try {
      obj.areaId = ObjectId.createFromHexString(obj.areaId);
    } catch (e) {
      console.log("Invalid areaId format:", obj.areaId);
    }
  }

  let driverAutoAssigned = false;

  // Residents: assign driver from dustbin only (no client-chosen driver); admins keep body as-is
  if (req.tokenData && req.tokenData.role === "resident" && obj.dustbinId) {
    delete obj.assignedDriverId;
    const dustbinCollection = db.collection("dustbins");
    const dustbin = await dustbinCollection.findOne({ _id: obj.dustbinId });
    if (dustbin && dustbin.assignedDriverId) {
      obj.assignedDriverId = dustbin.assignedDriverId;
      obj.status = "Assigned";
      driverAutoAssigned = true;
    }
  }
  
  // Convert assignedDriverId to ObjectId if provided
  if (obj.assignedDriverId && typeof obj.assignedDriverId === 'string' && obj.assignedDriverId.length === 24) {
    try {
      obj.assignedDriverId = ObjectId.createFromHexString(obj.assignedDriverId);
    } catch (e) {
      console.log("Invalid assignedDriverId format:", obj.assignedDriverId);
    }
  }
  
  // normalize text
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  if (driverAutoAssigned) {
    obj.driverAutoAssigned = true;
    obj.assignmentMessage = "Driver automatically assigned";
  }

  if (obj.assignedDriverId) {
    emitPickupAssignedToDriver(req, obj._id.toString()).catch((err) =>
      console.error("emitPickupAssignedToDriver (add):", err)
    );
  }

  return obj;
}

async function updatePickupRequest(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  let id = obj._id;
  const existingBefore = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  delete obj._id;
  
  // Convert dustbinId to ObjectId if provided
  if (obj.dustbinId && typeof obj.dustbinId === 'string' && obj.dustbinId.length === 24) {
    try {
      obj.dustbinId = ObjectId.createFromHexString(obj.dustbinId);
    } catch (e) {
      console.log("Invalid dustbinId format:", obj.dustbinId);
    }
  }
  
  // Convert areaId to ObjectId if provided
  if (obj.areaId && typeof obj.areaId === 'string' && obj.areaId.length === 24) {
    try {
      obj.areaId = ObjectId.createFromHexString(obj.areaId);
    } catch (e) {
      console.log("Invalid areaId format:", obj.areaId);
    }
  }
  
  // Convert assignedDriverId to ObjectId if provided
  if (obj.assignedDriverId && typeof obj.assignedDriverId === 'string' && obj.assignedDriverId.length === 24) {
    try {
      obj.assignedDriverId = ObjectId.createFromHexString(obj.assignedDriverId);
    } catch (e) {
      console.log("Invalid assignedDriverId format:", obj.assignedDriverId);
    }
  }
  
  // Normalize text fields
  const keys = Object.keys(obj);
  for (let key of keys) {
    if (typeof obj[key] == "string") {
      obj[key] = normalizeNewlines(obj[key]);
    }
  }
  
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );

  if (result.matchedCount === 1) {
    const after = await collection.findOne({
      _id: ObjectId.createFromHexString(id),
    });
    const beforeDriver = existingBefore?.assignedDriverId
      ? existingBefore.assignedDriverId.toString()
      : null;
    const afterDriver = after?.assignedDriverId
      ? after.assignedDriverId.toString()
      : null;
    if (afterDriver && afterDriver !== beforeDriver) {
      emitPickupAssignedToDriver(req, id).catch((err) =>
        console.error("emitPickupAssignedToDriver (update):", err)
      );
    }

    const beforeStatus = existingBefore?.status;
    const afterStatus = after?.status;
    if (
      afterStatus &&
      (afterStatus === "InProgress" || afterStatus === "Collected") &&
      beforeStatus !== afterStatus
    ) {
      emitPickupStatusUpdatedToResident(req, id).catch((err) =>
        console.error("emitPickupStatusUpdatedToResident (update):", err)
      );
    }
  }

  return result;
}

async function deletePickupRequest(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db(process.env.DB_NAME);
  const collection = db.collection("pickupRequests");
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

normalizeNewlines = (text) => {
  return text.replace(/\r\n/g, "\n");
};

module.exports = PickupRequestService = {
  getAllPickupRequests,
  getPickupRequestsByUserId,
  getPickupRequestsByDriverId,
  getPickupRequestById,
  addPickupRequest,
  updatePickupRequest,
  deletePickupRequest,
};
