import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminAreaForm from "./AdminAreaForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminAreas(props) {
  const navigate = useNavigate();
  const selectedEntity = {
    name: "Areas",
    singularName: "Area",
    dbCollection: "areas",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    accessLevel: "A",
  };
  let [areaList, setAreaList] = useState([]);
  let [filteredAreaList, setFilteredAreaList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [areaToBeEdited, setAreaToBeEdited] = useState("");
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
  let areaSchema = [
    { attribute: "areaName", type: "normal" },
    { attribute: "areaCode", type: "normal" },
    { attribute: "description", type: "text-area" },
    { attribute: "activeStatus", type: "normal" },
  ];
  let areaValidations = {
    areaName: {
      message: "",
      mxLen: 100,
      mnLen: 1,
      onlyDigits: false,
    },
    areaCode: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false,
    },
    description: {
      message: "",
      mxLen: 500,
      mnLen: 0,
      onlyDigits: false,
    },
    activeStatus: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false,
    },
  };
  let [showInList, setShowInList] = useState(getShowInList(areaSchema, cntShow));
  let [emptyArea, setEmptyArea] = useState(getEmptyObject(areaSchema));
  
  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/areas");
      let pList = await response.data;
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      setAreaList(pList);
      setFilteredAreaList(pList);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, refresh the page");
      } else {
        showMessage("Oops! An error occurred. Refresh the page");
      }
    }
    setFlagLoad(false);
  }

  async function handleFormSubmit(area) {
    let message;
    let areaForBackEnd = { ...area };
    for (let key in areaForBackEnd) {
      areaSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete areaForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/areas",
          areaForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedArea = await response.data;
        for (let key in area) {
          areaSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedArea[key] = area[key];
            }
          });
        }
        message = "Area added successfully";
        let prList = [...areaList];
        prList.push(addedArea);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setAreaList(prList);
        setFilteredAreaList(prList);
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
      areaForBackEnd._id = areaToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/areas",
          areaForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedArea = await response.data;
        message = "Area Updated successfully";
        let prList = areaList.map((e, index) => {
          if (e._id == updatedArea._id) return updatedArea;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredAreaList.map((e, index) => {
          if (e._id == updatedArea._id) return updatedArea;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setAreaList(prList);
        setFilteredAreaList(fprList);
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

  function handleEditButtonClick(area) {
    setAction("update");
    setAreaToBeEdited(area);
  }

  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleDeleteButtonClick(ans, area) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(area);
    }
  }

  async function performDeleteOperation(area) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/areas/" + area._id);
      let r = await response.data;
      message = `Area - ${area.areaName || area._id} deleted successfully.`;
      let prList = areaList.filter((e, index) => e._id != area._id);
      setAreaList(prList);
      let fprList = filteredAreaList.filter((e, index) => e._id != area._id);
      setFilteredAreaList(fprList);
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
    let list = [...filteredAreaList];
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
    setFilteredAreaList(list);
    setSortedField(field);
  }

  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredAreaList];
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
    setFilteredAreaList(list);
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
      setFilteredAreaList(areaList);
      return;
    }
    let searchedAreas = [];
    searchedAreas = filterByShowInListAttributes(query);
    setFilteredAreaList(searchedAreas);
  }

  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < areaList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            areaList[i][parameterName] &&
            String(areaList[i][parameterName])
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(areaList[i]);
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
      let result = analyseImportExcelSheet(jsonData, areaList);
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
          "areas",
          areaList,
          ""
        );
        if (result.success) {
          setAreaList(result.updatedList);
          setFilteredAreaList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "areas",
          areaList,
          ""
        );
        if (result.success) {
          setAreaList(result.updatedList);
          setFilteredAreaList(result.updatedList);
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
        filteredList={filteredAreaList}
        mainList={areaList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
      />
      {filteredAreaList.length == 0 && areaList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add area
            </button>
          )}
          <p>No area to show</p>
        </div>
      )}
      {areaList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredAreaList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredAreaList.length != 0 && (
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
          <AdminAreaForm
            areaSchema={areaSchema}
            areaValidations={areaValidations}
            emptyArea={emptyArea}
            selectedEntity={selectedEntity}
            areaToBeEdited={areaToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredAreaList.length != 0 &&
        filteredAreaList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredAreaList.length}
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
