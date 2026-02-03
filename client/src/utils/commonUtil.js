function formatToIST(dateString) {
  const options = {
    timeZone: "Asia/Kolkata", // IST
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // use 24-hour format
  };
  const formatted = new Date(dateString).toLocaleString("en-GB", options);
  return formatted.replace(",", "").replace(/\//g, "-");
}
function getShowInList(schema, cntShow) {
  let list = [];
  let cnt = 0;
  schema.forEach((e, index) => {
    let obj = {};
    if (e.type != "relationalId" && e.type != "array" && e.type != "location" && e.type != "password") {
      // do not show id of relational data and "array" is sort of sub-collection
      obj["attribute"] = e.attribute;
      if (e.label) {
        obj["label"] = e.label;
      }
      if (cnt < cntShow) {
        obj["show"] = true;
      } else {
        obj["show"] = false;
      }
      obj["type"] = e.type;
      if (e.type == "singleFile") {
        obj["allowedFileType"] = e.allowedFileType;
      }
      if (e.type == "text-area") {
        obj["flagReadMore"] = false;
      }
      cnt++;
      list.push(obj);
    }
  });
  return list;
}
function isImage(imageName) {
  if (!imageName) return false;
  let allowedImageTypes = ["jpg", "jpeg", "png"];
  return allowedImageTypes.includes(imageName.slice(imageName.length - 3));
}
function getFileExtension(fileName) {
  // search last . operator
  if (!fileName) return "";
  let pos = fileName.lastIndexOf(".");
  if (pos == -1) {
    //No dot operator in file name, may be file-extension missing
    return "";
  } else {
    return fileName.slice(pos + 1);
  }
}
function getEmptyObject(schema) {
  let obj = {};
  schema.forEach((e) => {
    if (e["defaultValue"]) {
      obj[e["attribute"]] = e["defaultValue"];
    } else if (e["type"] === "array") {
      obj[e["attribute"]] = [];
    } else {
      obj[e["attribute"]] = "";
    }
  });
  return obj;
}
export {
  formatToIST,
  getShowInList,
  getEmptyObject,
  isImage,
  getFileExtension,
};
