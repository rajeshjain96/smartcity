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
import AdminDustbinForm from "./AdminDustbinForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
// import {
//   recordsAddBulk,
//   recordsUpdateBulk,
//   analyseImportExcelSheet,
// } from "../external/vite-sdk";
import {recordsAddBulk} from "./RecordsAddBulk";
import {recordsUpdateBulk} from "./RecordsUpdateBulk";
import {analyseImportExcelSheet} from "./AnalyseImportExcelSheet";
// import { getEmptyObject, getShowInList } from "../external/vite-sdk";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminDustbins(props) {
  let [dustbinList, setDustbinList] = useState([]);
  let [filteredDustbinList, setFilteredDustbinList] = useState([]);
  let [areaList, setAreaList] = useState([]);
  let [driverList, setDriverList] = useState([]);

  let [action, setAction] = useState("list");
  let [dustbinToBeEdited, setDustbinToBeEdited] = useState("");
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
  let [cntShow, setCntShow] = useState(window.maxCnt); // Initially 5 attributes are shown
  let { selectedEntity } = props;
  let { flagFormInvalid } = props;
  let dustbinSchema = [
    { attribute: "binName", type: "normal" },
    { attribute: "areaName", type: "normal" },
    { attribute: "address", type: "normal" },
    { attribute: "status", type: "normal" },
    { attribute: "lastCleanedDate", type: "normal" },
    { attribute: "driverName", type: "normal" },
    { attribute: "capacity", type: "normal" },
    { attribute: "remarks", type: "text-area" },
  ];
  let dustbinValidations = {
    binName: {
      message: "",
      mxLen: 100,
      mnLen: 1,
      onlyDigits: false,
    },
    areaId: {
      message: "",
      mxLen: 100,
      mnLen: 0,
      onlyDigits: false,
    },
    address: {
      message: "",
      mxLen: 200,
      mnLen: 1,
      onlyDigits: false,
    },
    status: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false,
    },
    lastCleanedDate: {
      message: "",
      mxLen: 50,
      mnLen: 0,
      onlyDigits: false,
    },
    capacity: {
      message: "",
      mxLen: 20,
      mnLen: 0,
      onlyDigits: false,
    },
    assignedDriverId: {
      message: "",
      mxLen: 50,
      mnLen: 0,
      onlyDigits: false,
    },
    remarks: {
      message: "",
      mxLen: 500,
      mnLen: 0,
      onlyDigits: false,
    },
  };
  let [showInList, setShowInList] = useState(
    getShowInList(dustbinSchema, cntShow)
  );
  let [emptyDustbin, setEmptyDustbin] = useState(getEmptyObject(dustbinSchema));
  useEffect(() => {
    getAreas();
    getDrivers();
    getData();
  }, []);
  
  // Refetch dustbins when areas or drivers are loaded to populate names
  useEffect(() => {
    if (areaList.length > 0 || driverList.length > 0) {
      getData();
    }
  }, [areaList, driverList]);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/dustbins");
      let pList = await response.data;
      // Arrange products is sorted order as per updateDate
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      // update pList with relational-data
      pList.forEach((dustbin) => {
        // Add areaName for display
        if (dustbin.areaId) {
          const area = areaList.find(a => a._id === dustbin.areaId || a._id === dustbin.areaId.toString());
          dustbin.areaName = area ? area.areaName : "N/A";
        } else {
          dustbin.areaName = "N/A";
        }
        
        // Add driverName for display
        if (dustbin.assignedDriverId) {
          const driver = driverList.find(d => d._id === dustbin.assignedDriverId || d._id === dustbin.assignedDriverId.toString());
          dustbin.driverName = driver ? driver.driverName : "N/A";
        } else {
          dustbin.driverName = "Not Assigned";
        }
      }); //forEach
      setDustbinList(pList);
      setFilteredDustbinList(pList);
    } catch (error) {
      showMessage("Oops! An error occurred. Refresh the page");
    }
    setFlagLoad(false);
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
  
  async function getDrivers() {
    try {
      let response = await axios("/drivers");
      let list = await response.data;
      setDriverList(list);
    } catch (error) {
      console.log("Error fetching drivers:", error);
    }
  }

  async function handleFormSubmit(dustbin) {
    let message;
    // now remove relational data (areaName, driverName)
    let dustbinForBackEnd = { ...dustbin };
    delete dustbinForBackEnd.areaName;
    delete dustbinForBackEnd.driverName;
    
    for (let key in dustbinForBackEnd) {
      dustbinSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete dustbinForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      // dustbin = await addDustbinToBackend(dustbin);
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/dustbins",
          dustbinForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedDustbin = await response.data; //returned  with id
        // This addedDustbin has id, addDate, updateDate, but the relational data is lost
        // Add display names for area and driver
        if (addedDustbin.areaId) {
          const area = areaList.find(a => a._id === addedDustbin.areaId || a._id === addedDustbin.areaId.toString());
          addedDustbin.areaName = area ? area.areaName : "N/A";
        } else {
          addedDustbin.areaName = "N/A";
        }
        
        if (addedDustbin.assignedDriverId) {
          const driver = driverList.find(d => d._id === addedDustbin.assignedDriverId || d._id === addedDustbin.assignedDriverId.toString());
          addedDustbin.driverName = driver ? driver.driverName : "N/A";
        } else {
          addedDustbin.driverName = "Not Assigned";
        }
        
        for (let key in dustbin) {
          dustbinSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedDustbin[key] = dustbin[key];
            }
          });
        }
        message = "Dustbin added successfully";
        // update the dustbin list now.
        let prList = [...dustbinList];
        prList.push(addedDustbin);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setDustbinList(prList);
        // Since search box is cleared, reset filtered list to show all dustbins
        setFilteredDustbinList(prList);
        // update the list in sorted order of updateDate
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        showMessage("Somedustbin went wrong, refresh the page");
      }
      setFlagLoad(false);
    } //...add
    else if (action == "update") {
      dustbinForBackEnd._id = dustbinToBeEdited._id; // The form does not have id field
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/dustbins",
          dustbinForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedDustbin = await response.data;
        
        // Add display names for area and driver
        if (updatedDustbin.areaId) {
          const area = areaList.find(a => a._id === updatedDustbin.areaId || a._id === updatedDustbin.areaId.toString());
          updatedDustbin.areaName = area ? area.areaName : "N/A";
        } else {
          updatedDustbin.areaName = "N/A";
        }
        
        if (updatedDustbin.assignedDriverId) {
          const driver = driverList.find(d => d._id === updatedDustbin.assignedDriverId || d._id === updatedDustbin.assignedDriverId.toString());
          updatedDustbin.driverName = driver ? driver.driverName : "N/A";
        } else {
          updatedDustbin.driverName = "Not Assigned";
        }
        
        message = "Dustbin Updated successfully";
        // update the dustbin list now.
        let prList = dustbinList.map((e, index) => {
          if (e._id == updatedDustbin._id) return updatedDustbin;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredDustbinList.map((e, index) => {
          if (e._id == updatedDustbin._id) return updatedDustbin;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setDustbinList(prList);
        setFilteredDustbinList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        showMessage("Something went wrong, refresh the page");
      }
    } //else ...(update)
    setFlagLoad(false);
  }
  function handleFormCloseClick() {
    props.onFormCloseClick();
  }
  function handleListClick() {
    setAction("list");
  }
  function handleAddEntityClick() {
    setSearchText("");
    setAction("add");
  }
  function handleEditButtonClick(dustbin) {
    setAction("update");
    setDustbinToBeEdited(dustbin);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, dustbin) {
    if (ans == "No") {
      // delete operation cancelled
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      // delete operation allowed
      performDeleteOperation(dustbin);
    }
  }
  async function performDeleteOperation(dustbin) {
    setFlagLoad(true);
    try {
      let response = await axios.delete(
        "/dustbins/" + dustbin._id
      );
      let r = await response.data;
      message = `Dustbin - ${dustbin.binName || dustbin._id} deleted successfully.`;
      //update the dustbin list now.
      let prList = dustbinList.filter((e, index) => e._id != dustbin._id);
      setDustbinList(prList);

      let fprList = dustbinList.filter((e, index) => e._id != dustbin._id);
      setFilteredDustbinList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      showMessage("Somedustbin went wrong, refresh the page");
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
    let list = [...filteredDustbinList];
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
    setFilteredDustbinList(list);
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
    let list = [...filteredDustbinList];
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
    setFilteredDustbinList(list);
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
      setFilteredDustbinList(dustbinList);
      return;
    }
    let searchedDustbins = [];
    searchedDustbins = filterByShowInListAttributes(query);
    setFilteredDustbinList(searchedDustbins);
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
    for (let i = 0; i < dustbinList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            dustbinList[i][parameterName] &&
            dustbinList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(dustbinList[i]);
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
      let result = analyseImportExcelSheet(jsonData, dustbinList);
      if (result.message) {
        showMessage(result.message);
      } else {
        showImportAnalysis(result);
      }
      // analyseSheetData(jsonData, dustbinList);
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
          "dustbins",
          dustbinList,
          ""
        );
        if (result.success) {
          setDustbinList(result.updatedList);
          setFilteredDustbinList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "dustbins",
          dustbinList,
          ""
        );
        if (result.success) {
          setDustbinList(result.updatedList);
          setFilteredDustbinList(result.updatedList);
        }
        showMessage(result.message);
      } //if
    } catch (error) {
      console.log(error);
      showMessage("Somedustbin went wrong, refresh the page");
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
        filteredList={filteredDustbinList}
        mainList={dustbinList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
      />
      {filteredDustbinList.length == 0 && dustbinList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add dustbin
            </button>
          )}
          <p>No dustbin to show</p>
        </div>
      )}
      {dustbinList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredDustbinList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredDustbinList.length != 0 && (
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
          <AdminDustbinForm
            dustbinSchema={dustbinSchema}
            dustbinValidations={dustbinValidations}
            emptyDustbin={emptyDustbin}
            selectedEntity={selectedEntity}
            dustbinToBeEdited={dustbinToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            areaList={areaList}
            driverList={driverList}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredDustbinList.length != 0 &&
        filteredDustbinList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredDustbinList.length}
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
