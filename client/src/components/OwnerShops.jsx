import { useEffect, useState } from "react";
// import {
//   CommonUtilityBar,
//   CheckBoxHeaders,
//   ListHeaders,
//   Entity,
// } from "../external/vite-sdk";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import OwnerShopForm from "./OwnerShopForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
// import {
//   recordsAddBulk,
//   recordsUpdateBulk,
//   analyseImportExcelSheet,
// } from "../external/vite-sdk";
// import { getEmptyObject, getShowInList } from "../external/vite-sdk";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function OwnerShops(props) {
  let [shopList, setShopList] = useState([]);
  let [filteredShopList, setFilteredShopList] = useState([]);
  let [action, setAction] = useState("list");
  let [shopToBeEdited, setShopToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [flagImport, setFlagImport] = useState(false);
  let [message, setMessage] = useState("");
  let [searchText, setSearchText] = useState("");
  let [showFieldSelectorModal, setShowFieldSelectorModal] = useState(false);
  let [sortedField, setSortedField] = useState("");
  let [direction, setDirection] = useState("");
  let [sheetData, setSheetData] = useState(null);
  let [selectedFile, setSelectedFile] = useState("");
  let [recordsToBeAdded, setRecordsToBeAdded] = useState([]);
  let [recordsToBeUpdated, setRecordsToBeUpdated] = useState([]);
  let [cntUpdate, setCntUpdate] = useState(0);
  let [cntAdd, setCntAdd] = useState(0);
  let [cntShow, setCntShow] = useState(window.maxCnt); // Initially 5 attributes are shown
  let { selectedEntity } = props;
  let { flagFormInvalid } = props;
  let shopSchema = [
    { attribute: "name", type: "normal" },
    { attribute: "shopurl", type: "normal" },
    { attribute: "shopowner", type: "normal" },
    { attribute: "emailId", type: "normal" },
    { attribute: "mobileNumber", type: "normal" },
    { attribute: "whatsappNumber", type: "normal" },
    { attribute: "address", type: "normal" },
    { attribute: "status", type: "normal" },
  ];
  let shopValidations = {
    name: {
      message: "",
      mxLen: 30,
      mnLen: 3,
      onlyDigits: false,
    },
    shopurl: {
      message: "",
      mxLen: 30,
      mnLen: 3,
      onlyDigits: false,
    },
    shopowner: {
      message: "",
      mxLen: 40,
      mnLen: 3,
      onlyDigits: false,
    },
    emailId: {
      message: "",
      mxLen: 40,
      mnLen: 7,
      onlyDigits: false,
    },
    mobileNumber: {
      message: "",
      mxLen: 10,
      mnLen: 10,
      onlyDigits: true,
    },
    whatsappNumber: {
      message: "",
      mxLen: 10,
      mnLen: 10,
      onlyDigits: false,
    },
    address: {
      message: "",
      mxLen: 100,
      mnLen: 10,
      onlyDigits: false,
    },
    status: {
      message: "",
      mxLen: 10,
      mnLen: 4,
      onlyDigits: false,
    },
  };
  let [showInList, setShowInList] = useState(
    getShowInList(shopSchema, cntShow)
  );
  let [emptyShop, setEmptyShop] = useState(getEmptyObject(shopSchema));
  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios(import.meta.env.VITE_API_URL + "/api/shops");
      let pList = await response.data;
      // Arrange products is sorted order as per updateDate
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      // update pList with relational-data
      pList.forEach((shop) => {}); //forEach
      setShopList(pList);
      setFilteredShopList(pList);
    } catch (error) {
      showMessage("Oops! An error occurred. Refresh the page");
    }
    setFlagLoad(false);
  }

  async function handleFormSubmit(shop) {
    let message;
    // now remove relational data
    let shopForBackEnd = { ...shop };
    for (let key in shopForBackEnd) {
      shopSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete shopForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      // shop = await addShopToBackend(shop);
      setFlagLoad(true);
      try {
        let response = await axios.post("/shops", shopForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        let addedShop = await response.data; //returned  with id
        // This addedShop has id, addDate, updateDate, but the relational data is lost
        // The original shop has got relational data.
        for (let key in shop) {
          shopSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedShop[key] = shop[key];
            }
          });
        }
        message = "Shop added successfully";
        // update the shop list now.
        let prList = [...shopList];
        prList.push(addedShop);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setShopList(prList);
        let fprList = [...filteredShopList];
        fprList.push(addedShop);
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setFilteredShopList(fprList);
        // update the list in sorted order of updateDate
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        const errorMessage = error.response?.data?.error || "Something went wrong, refresh the page";
        showMessage(errorMessage);
      }
      setFlagLoad(false);
    } //...add
    else if (action == "update") {
      shopForBackEnd._id = shopToBeEdited._id; // The form does not have id field
      setFlagLoad(true);
      try {
        let response = await axios.put("/shops", shopForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        // update the shop list now, relational data is not deleted
        message = "Shop Updated successfully";
        // update the shop list now.
        let prList = shopList.map((e, index) => {
          if (e._id == shop._id) return shop;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredShopList.map((e, index) => {
          if (e._id == shop._id) return shop;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setShopList(prList);
        setFilteredShopList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        const errorMessage = error.response?.data?.error || "Something went wrong, refresh the page";
        showMessage(errorMessage);
      }
    } //else ...(update)
    setFlagLoad(false);
  }
  function handleFormCloseClick() {
    props.onFormCloseClick();
  }
  function handleFormCancelClick() {
    setAction("list");
  }
  function handleListClick() {
    setAction("list");
  }
  function handleAddEntityClick() {
    setAction("add");
  }
  function handleEditButtonClick(shop) {
    setAction("update");
    setShopToBeEdited(shop);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, shop) {
    if (ans == "No") {
      // delete operation cancelled
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      // delete operation allowed
      performDeleteOperation(shop);
    }
  }
  async function performDeleteOperation(shop) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/shops/" + shop._id);
      let r = await response.data;
      message = `Shop - ${shop.name} deleted successfully.`;
      //update the shop list now.
      let prList = shopList.filter((e, index) => e._id != shop._id);
      setShopList(prList);

      let fprList = shopList.filter((e, index) => e._id != shop._id);
      setFilteredShopList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.error || "Something went wrong, refresh the page";
      showMessage(errorMessage);
    }
    setFlagLoad(false);
  }
  function handleListCheckBoxClick(checked, selectedIndex) {
    // Minimum 1 field should be shown
    let cnt = 0;
    showInList.forEach((e, index) => {
      if (e.show) {
        cnt++;
      }
    });
    if (cnt == 1 && !checked) {
      showMessage("Minimum 1 field should be selected.");
      return;
    }
    if (cnt == window.maxCnt && checked) {
      showMessage("Maximum " + window.maxCnt + " fields can be selected.");
      return;
    }
    let att = [...showInList];
    let a = att.map((e, index) => {
      let p = { ...e };
      if (index == selectedIndex && checked) {
        p.show = true;
        setCntShow(cnt + 1);
      } else if (index == selectedIndex && !checked) {
        p.show = false;
        setCntShow(cnt - 1);
      }
      return p;
    });
    setShowInList(a);
  }
  function handleSelectClick(selectedIndex) {
    // Minimum 1 field should be shown
    let cnt = 0;
    showInList.forEach((e, index) => {
      if (e.show) {
        cnt++;
      }
    });
    let att = [...showInList];
    let flag = false;
    att.forEach((e, index) => {
      let p = { ...e };
      if (cnt == 1 && index == selectedIndex && p.show == true) {
        //user wants to deselect
        showMessage("Minimum 1 field should be selected.");
        flag = true;
      } else if (
        cnt == window.maxCnt &&
        index == selectedIndex &&
        p.show == false
      ) {
        showMessage("Maximum " + window.maxCnt + " fields can be selected.");
        flag = true;
      }
    });
    if (flag) return;
    att = [...showInList];
    let a = att.map((e, index) => {
      let p = { ...e };
      if (index == selectedIndex && p.show == false) {
        p.show = true;
        setCntShow(cnt + 1);
      } else if (index == selectedIndex && p.show == true) {
        p.show = false;
        setCntShow(cnt - 1);
      }
      return p;
    });
    setShowInList(a);
  }
  function handleHeaderClick(index) {
    let field = showInList[index].attribute;
    let d = false;
    if (field === sortedField) {
      // same button clicked twice
      d = !direction;
    } else {
      // different field
      d = false;
    }
    let list = [...filteredShopList];
    setDirection(d);
    if (d == false) {
      //in ascending order
      list.sort((a, b) => {
        if (a[field] > b[field]) {
          return 1;
        }
        if (a[field] < b[field]) {
          return -1;
        }
        return 0;
      });
    } else {
      //in descending order
      list.sort((a, b) => {
        if (a[field] < b[field]) {
          return 1;
        }
        if (a[field] > b[field]) {
          return -1;
        }
        return 0;
      });
    }
    setFilteredShopList(list);
    setSortedField(field);
  }
  function handleSrNoClick() {
    // let field = selectedEntity.attributes[index].id;
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredShopList];
    setDirection(!direction);
    if (d == false) {
      //in ascending order
      list.sort((a, b) => {
        if (new Date(a["updateDate"]) > new Date(b["updateDate"])) {
          return 1;
        }
        if (new Date(a["updateDate"]) < new Date(b["updateDate"])) {
          return -1;
        }
        return 0;
      });
    } else {
      //in descending order
      list.sort((a, b) => {
        if (new Date(a["updateDate"]) < new Date(b["updateDate"])) {
          return 1;
        }
        if (new Date(a["updateDate"]) > new Date(b["updateDate"])) {
          return -1;
        }
        return 0;
      });
    }
    // setSelectedList(list);
    setFilteredShopList(list);
    setSortedField("updateDate");
  }
  function handleFormTextChangeValidations(message, index) {
    props.onFormTextChangeValidations(message, index);
  }
  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);
    performSearchOperation(searchText);
  }
  function performSearchOperation(searchText) {
    let query = searchText.trim();
    if (query.length == 0) {
      setFilteredShopList(shopList);
      return;
    }
    let searchedShops = [];
    searchedShops = filterByShowInListAttributes(query);
    setFilteredShopList(searchedShops);
  }
  function filterByName(query) {
    let fList = [];
    for (let i = 0; i < selectedList.length; i++) {
      if (selectedList[i].name.toLowerCase().includes(query.toLowerCase())) {
        fList.push(selectedList[i]);
      }
    } //for
    return fList;
  }
  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < shopList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            shopList[i][parameterName] &&
            shopList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(shopList[i]);
            break;
          }
        }
      } //inner for
    } //outer for
    return fList;
  }
  function handleToggleText(index) {
    let sil = [...showInList];
    sil[index].flagReadMore = !sil[index].flagReadMore;
    setShowInList(sil);
  }
  function handleExcelFileUploadClick(file, msg) {
    if (msg) {
      showMessage(message);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      // Read the workbook from the array buffer
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      // Assume reading the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      // const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setSheetData(jsonData);
      let result = analyseImportExcelSheet(jsonData, shopList);
      if (result.message) {
        showMessage(result.message);
      } else {
        showImportAnalysis(result);
      }
      // analyseSheetData(jsonData, shopList);
    };
    // reader.readAsBinaryString(file);
    reader.readAsArrayBuffer(file);
  }
  function showImportAnalysis(result) {
    setCntAdd(result.cntA);
    setCntUpdate(result.cntU);
    setRecordsToBeAdded(result.recordsToBeAdded);
    setRecordsToBeUpdated(result.recordsToBeUpdated);
    //open modal
    setFlagImport(true);
  }
  function handleModalCloseClick() {
    setFlagImport(false);
  }
  async function handleImportButtonClick() {
    setFlagImport(false); // close the modal
    setFlagLoad(true);
    let result;
    try {
      if (recordsToBeAdded.length > 0) {
        result = await recordsAddBulk(
          recordsToBeAdded,
          "shops",
          shopList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setShopList(result.updatedList);
          setFilteredShopList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "shops",
          shopList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setShopList(result.updatedList);
          setFilteredShopList(result.updatedList);
        }
        showMessage(result.message);
      } //if
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.error || "Something went wrong, refresh the page";
      showMessage(errorMessage);
    }
    setFlagLoad(false);
  }
  function handleClearSelectedFile() {
    setSelectedFile(null);
  }
  if (flagLoad) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }
  return (
    <div className="container" style={{ paddingTop: "0.5rem" }}>
      <CommonUtilityBar
        action={action}
        message={message}
        selectedEntity={selectedEntity}
        filteredList={filteredShopList}
        mainList={shopList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {action == "list" && filteredShopList.length == 0 && shopList.length != 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="bi bi-search"></i>
          </div>
          <h5 className="empty-state-title">No shops found</h5>
          <p className="empty-state-message">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
      {action == "list" && shopList.length == 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h5 className="empty-state-title">No shops yet</h5>
          <p className="empty-state-message">
            Get started by adding your first shop using the + button above.
          </p>
        </div>
      )}
      {action == "list" && filteredShopList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
          onSelectClick={handleSelectClick}
        />
      )}
      {action == "list" && filteredShopList.length != 0 && (
        <div className="row mb-1 mx-auto px-2 py-1 bg-light rounded">
          <div className="col-1">
            <a
              href="#"
              onClick={() => {
                handleSrNoClick();
              }}
              className="text-decoration-none fw-semibold"
            >
              SN.{" "}
              {sortedField == "updateDate" && direction && (
                <i className="bi bi-arrow-up"></i>
              )}
              {sortedField == "updateDate" && !direction && (
                <i className="bi bi-arrow-down"></i>
              )}
            </a>
          </div>
          <ListHeaders
            showInList={showInList}
            sortedField={sortedField}
            direction={direction}
            cntShow={cntShow}
            onHeaderClick={handleHeaderClick}
          />
          <div className="col-1">&nbsp;</div>
        </div>
      )}
      {(action == "add" || action == "update") && (
        <div className="row">
          <OwnerShopForm
            shopSchema={shopSchema}
            shopValidations={shopValidations}
            emptyShop={emptyShop}
            selectedEntity={selectedEntity}
            shopToBeEdited={shopToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCancelClick={handleFormCancelClick}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredShopList.length != 0 &&
        filteredShopList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredShopList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
          />
        ))}
      {flagImport && (
        <ModalImport
          modalText={"Summary of Bulk Import"}
          additions={recordsToBeAdded}
          updations={recordsToBeUpdated}
          btnGroup={["Yes", "No"]}
          onModalCloseClick={handleModalCloseClick}
          onModalButtonCancelClick={handleModalCloseClick}
          onImportButtonClick={handleImportButtonClick}
        />
      )}
    </div>
  );
}
