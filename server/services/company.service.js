const { app } = require("../init.js");
const { ObjectId } = require("mongodb");

async function getAllCompanies(req) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
  const catalogCollection = db.collection("catalogs");

  let list = await collection.find().toArray();

  // Get catalog counts for each company
  try {
    // Get all catalogs with their companyId
    const catalogs = await catalogCollection.find({}, { projection: { companyId: 1 } }).toArray();
    
    // Count catalogs per company
    const catalogCounts = {};
    catalogs.forEach((catalog) => {
      if (catalog.companyId) {
        const companyIdStr = String(catalog.companyId);
        catalogCounts[companyIdStr] = (catalogCounts[companyIdStr] || 0) + 1;
      }
    });
    
    // Add catalogCount to each company
    list.forEach((company) => {
      const companyIdStr = String(company._id);
      company.catalogCount = catalogCounts[companyIdStr] || 0;
    });
  } catch (error) {
    console.error("Error fetching catalog counts:", error);
    // If catalog fetch fails, set count to 0 for all companies
    list.forEach((company) => {
      company.catalogCount = 0;
    });
  }

  return list;
}
async function getCompanyById(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
  
  const companyObj = await collection.findOne({
    _id: ObjectId.createFromHexString(id),
  });
  return companyObj;
}
async function addCompany(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
  
  let result = await collection.insertOne(obj);
  obj._id = result.insertedId;
  return obj;
}
async function updateCompany(req, obj) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
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
async function deleteCompany(req, id) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
  
  let obj = await collection.deleteOne({
    _id: ObjectId.createFromHexString(id),
  });
  return obj;
}

async function addManyCompanies(req, companies) {
  const client = req.app.locals.mongoClient;
  const db = client.db("homedecor_"+req.tokenData.shopurl);
  const collection = db.collection("companies");
  
  // Normalize text fields for each company
  companies.forEach((company) => {
    const keys = Object.keys(company);
    for (let key of keys) {
      if (typeof company[key] == "string") {
        company[key] = company[key].replace(/\r\n/g, "\n");
      }
    }
  });
  
  const result = await collection.insertMany(companies);
  const insertedIds = Object.values(result.insertedIds);
  const insertedDocs = await collection
    .find({ _id: { $in: insertedIds } })
    .toArray();
  return insertedDocs;
}

module.exports = CompanyService = {
  getAllCompanies,
  getCompanyById,
  addCompany,
  updateCompany,
  deleteCompany,
  addManyCompanies,
};

