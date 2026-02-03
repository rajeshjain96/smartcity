export  function analyseImportExcelSheet(jsonData, list) {
  let result = {};
  let cntU = 0,
    cntA = 0;
  let flag, i, k;
  let productsA = [],
    productsU = [];
  jsonData.forEach((sheetProduct, index) => {
    if (!sheetProduct._id) {
      cntA++;
      productsA.push(sheetProduct);
    }
  });
  if (cntA == jsonData.length) {
    result.message = "Sorry...products should have ID";
    return result;
  }
  // All current products should be in the excel file.

  // productList.forEach((product, index) => {
  for (k = 0; k < list.length; k++) {
    flag = false;
    for (i = 0; i < jsonData.length; i++) {
      if (list[k]._id == jsonData[i]._id) {
        flag = true; //found
        break;
      } //if
    } //for
    if (!flag) {
      // not found
      result.message = "Data Mismatch.. Use latest downloaded file...";
      return result;
    }
  }
  for (let k = 0; k < jsonData.length; k++) {
    let data = jsonData[k];
    flag = false;
    for (i = 0; i < list.length; i++) {
      if (data._id == list[i]._id) {
        flag = true; //found
        if (compareAllValues(list[i], data)) {
          // some value is modified, so add this to update list
          productsU.push(data);
          // console.log(data);
          cntU++;
        }
        break;
      } //if
    } //for
    if (!flag && data._id) {
      // not found
      result.message = "Do not assign ID to new records.";
      return result;
    }
  } //outer for
  if (cntA == 0 && cntU == 0) {
    result.message = "No Additions, No Modifications";
    return result;
  }
  result.cntA = cntA;
  result.cntU = cntU;
  result.recordsToBeAdded = productsA;
  result.recordsToBeUpdated = productsU;
  result.message = "";
  return result;
  //   setFlagImport(true);
  //   setFlagLoad(false);
}
const normalizeNewlines = (text) => {
  // typeof str === "string" ? str.replace(/\r\n/g, "\n") : str;
  if (typeof text !== "string") return text;

  // Replace all \r\r\n with \n (handle Excel paste weirdness)
  text = text.replace(/\r\r\n/g, "\n");

  // Replace all remaining \r\n with \n
  text = text.replace(/\r\n/g, "\n");

  // Optional: remove standalone \r if any
  text = text.replace(/\r/g, "");

  return text;
};
function compareAllValues(product, data) {
  const keys = Object.keys(data);
  for (let key of keys) {
    if (normalizeNewlines(data[key]) != normalizeNewlines(product[key])) {
      console.log(key);

      // console.log(data[key] + " " + product[key]);
      return true;
    }
  }
  return false;
}
