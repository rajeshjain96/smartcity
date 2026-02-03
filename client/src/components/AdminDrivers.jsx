import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminDriverForm from "./AdminDriverForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminDrivers(props) {
  const navigate = useNavigate();
  const selectedEntity = {
    name: "Drivers",
    singularName: "Driver",
    dbCollection: "drivers",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    accessLevel: "A",
  };
  let [driverList, setDriverList] = useState([]);
  let [filteredDriverList, setFilteredDriverList] = useState([]);
  let [userList, setUserList] = useState([]);
  let [areaList, setAreaList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [driverToBeEdited, setDriverToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [flagImport, setFlagImport] = useState(false);
  let [message, setMessage] = useState("");
  let [searchText, setSearchText] = useState("");
  let [sortedField, setSortedField] = useState("");
  let [direction, setDirection] = useState("");
  let [sheetData, setSheetData] = useState(null);
  let [selectedFile, setSelectedFile] = useState("");
  let [recordsToBeAdded, setRecordsToBeAdded] = useState([]);
  let [recordsToBeUpdated, setRecordsToBeUpdated] = useState([]);
  let [cntUpdate, setCntUpdate] = useState(0);
  let [cntAdd, setCntAdd] = useState(0);
  let [cntShow, setCntShow] = useState(window.maxCnt);
  let { flagFormInvalid } = props;
  
  let driverSchema = [
    { attribute: "driverName", type: "normal" },
    { attribute: "mobileNumber", type: "normal" },
    { attribute: "vehicleNumber", type: "normal" },
    { attribute: "activeStatus", type: "normal" },
    { attribute: "assignedAreas", type: "normal" },
  ];
  
  let driverValidations = {
    userId: {
      message: "",
      mxLen: 100,
      mnLen: 1,
      onlyDigits: false,
    },
    driverName: {
      message: "",
      mxLen: 100,
      mnLen: 1,
      onlyDigits: false,
    },
    mobileNumber: {
      message: "",
      mxLen: 15,
      mnLen: 10,
      onlyDigits: true,
    },
    vehicleNumber: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false,
    },
    activeStatus: {
      message: "",
      mxLen: 20,
      mnLen: 0,
      onlyDigits: false,
    },
  };
  
  let [showInList, setShowInList] = useState(getShowInList(driverSchema, cntShow));
  let [emptyDriver, setEmptyDriver] = useState(getEmptyObject(driverSchema));
  
  useEffect(() => {
    getData();
    getUsers();
    getAreas();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/drivers");
      let pList = await response.data;
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      
      // Add relational data for assigned areas
      pList.forEach((driver) => {
        driver.assignedAreas = "";
      });
      
      setDriverList(pList);
      setFilteredDriverList(pList);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, refresh the page");
      } else {
        showMessage("Oops! An error occurred. Refresh the page");
      }
    }
    setFlagLoad(false);
  }

  async function getUsers() {
    try {
      let response = await axios("/users");
      let list = await response.data;
      setUserList(list);
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  }

  async function getAreas() {
    try {
      let response = await axios("/areas");
      let list = await response.data;
      setAreaList(list);
    } catch (error) {
      console.log("Error fetching areas:", error);
    }
  }

  async function handleFormSubmit(driver) {
    let message;
    let driverForBackEnd = { ...driver };
    
    // Remove relational data before sending to backend
    for (let key in driverForBackEnd) {
      driverSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete driverForBackEnd[key];
        }
      });
    }
    
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/drivers",
          driverForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedDriver = await response.data;
        
        // Restore relational data
        for (let key in driver) {
          driverSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedDriver[key] = driver[key];
            }
          });
        }
        
        // Populate assigned areas for display
        addedDriver.assignedAreas = getAreaNamesFromIds(addedDriver.assignedAreaIds);
        
        message = "Driver added successfully";
        let prList = [...driverList];
        prList.push(addedDriver);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setDriverList(prList);
        setFilteredDriverList(prList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
      }
      setFlagLoad(false);
    } else if (action == "update") {
      driverForBackEnd._id = driverToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/drivers",
          driverForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedDriver = await response.data;
        
        // Populate assigned areas for display
        updatedDriver.assignedAreas = getAreaNamesFromIds(updatedDriver.assignedAreaIds);
        
        message = "Driver Updated successfully";
        let prList = driverList.map((e, index) => {
          if (e._id == updatedDriver._id) return updatedDriver;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredDriverList.map((e, index) => {
          if (e._id == updatedDriver._id) return updatedDriver;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setDriverList(prList);
        setFilteredDriverList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
      }
      setFlagLoad(false);
    }
  }

  function getAreaNamesFromIds(areaIds) {
    if (!areaIds || !Array.isArray(areaIds) || areaIds.length === 0) {
      return "None";
    }
    let names = areaIds.map(areaId => {
      let area = areaList.find(a => a._id === areaId);
      return area ? area.areaName : areaId;
    });
    return names.join(", ");
  }

  function handleFormCloseClick() {
    setAction("list");
  }

  function handleListClick() {
    setAction("list");
  }

  function handleAddEntityClick() {
    setSearchText("");
    setAction("add");
  }

  function handleEditButtonClick(driver) {
    setAction("update");
    setDriverToBeEdited(driver);
  }

  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleDeleteButtonClick(ans, driver) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(driver);
    }
  }

  async function performDeleteOperation(driver) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/drivers/" + driver._id);
      let r = await response.data;
      message = `Driver - ${driver.driverName || driver._id} deleted successfully.`;
      let prList = driverList.filter((e, index) => e._id != driver._id);
      setDriverList(prList);
      let fprList = filteredDriverList.filter((e, index) => e._id != driver._id);
      setFilteredDriverList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, refresh the page");
      } else {
        showMessage("Something went wrong, refresh the page");
      }
    }
    setFlagLoad(false);
  }

  function handleListCheckBoxClick(checked, selectedIndex) {
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

  function handleHeaderClick(index) {
    let field = showInList[index].attribute;
    let d = false;
    if (field === sortedField) {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredDriverList];
    setDirection(d);
    if (d == false) {
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
    setFilteredDriverList(list);
    setSortedField(field);
  }

  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredDriverList];
    setDirection(!direction);
    if (d == false) {
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
    setFilteredDriverList(list);
    setSortedField("updateDate");
  }

  function handleFormTextChangeValidations(message, index) {
    if (props.onFormTextChangeValidations) {
      props.onFormTextChangeValidations(message, index);
    }
  }

  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);
    performSearchOperation(searchText);
  }

  function performSearchOperation(searchText) {
    let query = searchText.trim();
    if (query.length == 0) {
      setFilteredDriverList(driverList);
      return;
    }
    let searchedDrivers = [];
    searchedDrivers = filterByShowInListAttributes(query);
    setFilteredDriverList(searchedDrivers);
  }

  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < driverList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            driverList[i][parameterName] &&
            String(driverList[i][parameterName])
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(driverList[i]);
            break;
          }
        }
      }
    }
    return fList;
  }

  function handleToggleText(index) {
    let sil = [...showInList];
    sil[index].flagReadMore = !sil[index].flagReadMore;
    setShowInList(sil);
  }

  function handleExcelFileUploadClick(file, msg) {
    if (msg) {
      showMessage(msg);
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setSheetData(jsonData);
      let result = analyseImportExcelSheet(jsonData, driverList);
      if (result.message) {
        showMessage(result.message);
      } else {
        showImportAnalysis(result);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function showImportAnalysis(result) {
    setCntAdd(result.cntA);
    setCntUpdate(result.cntU);
    setRecordsToBeAdded(result.recordsToBeAdded);
    setRecordsToBeUpdated(result.recordsToBeUpdated);
    setFlagImport(true);
  }

  function handleModalCloseClick() {
    setFlagImport(false);
  }

  async function handleImportButtonClick() {
    setFlagImport(false);
    setFlagLoad(true);
    let result;
    try {
      if (recordsToBeAdded.length > 0) {
        result = await recordsAddBulk(
          recordsToBeAdded,
          "drivers",
          driverList,
          ""
        );
        if (result.success) {
          setDriverList(result.updatedList);
          setFilteredDriverList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "drivers",
          driverList,
          ""
        );
        if (result.success) {
          setDriverList(result.updatedList);
          setFilteredDriverList(result.updatedList);
        }
        showMessage(result.message);
      }
    } catch (error) {
      console.log(error);
      showMessage("Something went wrong, refresh the page");
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
    <div className="container">
      <CommonUtilityBar
        action={action}
        message={message}
        selectedEntity={selectedEntity}
        filteredList={filteredDriverList}
        mainList={driverList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
      />
      {filteredDriverList.length == 0 && driverList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add driver
            </button>
          )}
          <p>No driver to show</p>
        </div>
      )}
      {driverList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredDriverList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredDriverList.length != 0 && (
        <div className="row   my-2 mx-auto  p-1">
          <div className="col-1">
            <a
              href="#"
              onClick={() => {
                handleSrNoClick();
              }}
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
          <AdminDriverForm
            driverSchema={driverSchema}
            driverValidations={driverValidations}
            emptyDriver={emptyDriver}
            selectedEntity={selectedEntity}
            driverToBeEdited={driverToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            userList={userList}
            areaList={areaList}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredDriverList.length != 0 &&
        filteredDriverList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredDriverList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
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
