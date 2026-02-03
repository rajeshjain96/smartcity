const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllCatalogs(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");

  // Build query based on query parameters
  let query = {};
  if (req.query && req.query.companyId) {
    // Filter by companyId
    // Handle both ObjectId and string formats
    const companyIdStr = String(req.query.companyId).trim();
    
    console.log(`[getAllCatalogs] Filtering by companyId: ${companyIdStr}`);
    
    try {
      // Try to convert to ObjectId first (for proper ObjectId matching)
      const companyObjectId = ObjectId.createFromHexString(companyIdStr);
      
      // Query for both ObjectId and string formats to handle any data inconsistencies
      query.$or = [
        { companyId: companyObjectId },
        { companyId: companyIdStr }
      ];
      
      console.log(`[getAllCatalogs] Using ObjectId query for: ${companyIdStr}`);
    } catch (error) {
      // If conversion fails (invalid ObjectId format), just use string comparison
      query.companyId = companyIdStr;
      console.log(`[getAllCatalogs] Using string query for: ${companyIdStr}`);
    }
  }

  let list = await collection.find(query).toArray();
  console.log(`[getAllCatalogs] Found ${list.length} catalogs from MongoDB query`);
  
  // Additional filtering: ensure we match by string comparison as well
  // This catches cases where companyId might be stored in a different format
  if (req.query && req.query.companyId) {
    const companyIdStr = String(req.query.companyId).trim();
    const originalCount = list.length;
    
    // Log sample catalog companyIds for debugging
    if (list.length > 0) {
      console.log(`[getAllCatalogs] Sample catalog companyIds:`, list.slice(0, 3).map(c => ({
        catalogId: c._id,
        companyId: c.companyId,
        companyIdType: typeof c.companyId,
        companyIdString: String(c.companyId)
      })));
    }
    
    list = list.filter(catalog => {
      if (!catalog.companyId) {
        console.log(`[getAllCatalogs] Catalog ${catalog._id} has no companyId`);
        return false;
      }
      const catalogCompanyIdStr = String(catalog.companyId);
      const matches = catalogCompanyIdStr === companyIdStr;
      if (!matches && originalCount <= 5) {
        console.log(`[getAllCatalogs] Catalog ${catalog._id} companyId mismatch: "${catalogCompanyIdStr}" !== "${companyIdStr}"`);
      }
      return matches;
    });
    
    // Log for debugging
    console.log(`[getAllCatalogs] After string filtering: ${originalCount} -> ${list.length} catalogs for companyId: ${companyIdStr}`);
  }

  return list;
}
async function getCatalogById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  
  const catalogObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return catalogObj;
}
async function addCatalog(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}
async function updateCatalog(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  let id = obj._id;
  delete obj._id;
  
  let result = await collection.updateOne(
    { _id: ObjectId.createFromHexString(id) },
    { $set: obj }
  );
  if (result.modifiedCount == 1) {
    obj._id = id;
    return obj;
  }
  return null;
}
async function deleteCatalog(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

async function addManyCatalogs(req, catalogs) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  
  // Normalize text fields and convert priceInRs for each catalog
  catalogs.forEach((catalog) => {
    const keys = Object.keys(catalog);
    for (let key of keys) {
      if (typeof catalog[key] == "string") {
        catalog[key] = catalog[key].replace(/\r\n/g, "\n");
      }
    }
    // Convert priceInRs to number if it's a string and round to integer
    if (catalog.priceInRs) {
      catalog.priceInRs = Math.round(parseFloat(catalog.priceInRs));
    }
  });
  
  const result = await collection.insertMany(catalogs);
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = await collection
    .find({ _id: { $in: insertedIds } })
    .toArray();
  return insertedDocs;
}

async function updateManyCatalogs(req, catalogs) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("catalogs");
  
  // Normalize text fields and convert priceInRs for each catalog
  catalogs.forEach((catalog) => {
    const keys = Object.keys(catalog);
    for (let key of keys) {
      if (typeof catalog[key] == "string") {
        catalog[key] = catalog[key].replace(/\r\n/g, "\n");
      }
    }
    // Convert priceInRs to number if it's a string and round to integer
    if (catalog.priceInRs) {
      catalog.priceInRs = Math.round(parseFloat(catalog.priceInRs));
    }
  });
  
  // Prepare bulk operations
  const operations = catalogs.map((catalog) => {
    const { _id, ...fieldsToUpdate } = catalog;
    return {
      updateOne: {
        filter: { _id: ObjectId.createFromHexString(_id) },
        update: { $set: fieldsToUpdate },
      },
    };
  });
  const result = await collection.bulkWrite(operations);
  const updatedIds = catalogs.map((p) => ObjectId.createFromHexString(p._id));

  const updatedCatalogs = await collection
    .find({ _id: { $in: updatedIds } })
    .toArray();
  return updatedCatalogs;
}

module.exports = CatalogService = {
  getAllCatalogs,
  getCatalogById,
  addCatalog,
  updateCatalog,
  deleteCatalog,
  addManyCatalogs,
  updateManyCatalogs,
};

