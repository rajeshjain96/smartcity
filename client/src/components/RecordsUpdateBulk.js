import axios from "axios";

export async function recordsUpdateBulk(
  recordsToBeUpdated,
  entity,
  list,
  VITE_API_URL
) {
  let result = {};
  try {
    const response = await axios.put(
      VITE_API_URL + "/api/" + entity + "/bulk-update",
      recordsToBeUpdated
    );
    // Add this to the list
    const updatedRecords = response.data;
    let i, flag;
    let l = list.map((e, index) => {
      // search e_id in updatedProducts
      for (i = 0, flag = false; i < updatedRecords.length; i++) {
        if (e._id == updatedRecords[i]._id) {
          flag = true;
          break;
        }
      } //for
      if (flag) return updatedRecords[i];
      else return e;
    });
    result.message =
      updatedRecords.length +
      (updatedRecords.length == 1 ? " record" : " records") +
      " updated successfully";
    result.updatedList = l;
    result.success = true;
    return result;
  } catch (error) {
    console.log(error);
    result.message("Something went wrong, refresh the page");
    result.updatedList = list;
    result.success = false;
    return result;
  }
}
