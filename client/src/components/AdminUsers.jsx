import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminUserForm from "./AdminUserForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminUsers(props) {
  const navigate = useNavigate();
  // Use selectedEntity from props if available, otherwise use default
  const selectedEntity = props.selectedEntity || {
    name: "Users",
    singularName: "User",
    dbCollection: "users",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    accessLevel: "A",
  };
  let [userList, setUserList] = useState([]);
  let [filteredUserList, setFilteredUserList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [userToBeEdited, setUserToBeEdited] = useState("");
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
  
  let userSchema = [
    { attribute: "name", type: "normal" },
    { attribute: "emailId", type: "normal" },
    { attribute: "mobileNumber", type: "normal" },
    { attribute: "role", type: "normal" },
    { attribute: "status", type: "normal" },
  ];
  
  let userValidations = {
    name: {
      message: "",
      mxLen: 100,
      mnLen: 1,
      onlyDigits: false,
    },
    emailId: {
      message: "",
      mxLen: 100,
      mnLen: 5,
      onlyDigits: false,
    },
    mobileNumber: {
      message: "",
      mxLen: 15,
      mnLen: 0,
      onlyDigits: true,
    },
    role: {
      message: "",
      mxLen: 20,
      mnLen: 0,
      onlyDigits: false,
    },
    status: {
      message: "",
      mxLen: 20,
      mnLen: 0,
      onlyDigits: false,
    },
  };
  
  let [showInList, setShowInList] = useState(getShowInList(userSchema, cntShow));
  let [emptyUser, setEmptyUser] = useState(getEmptyObject(userSchema));
  
  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/users");
      let pList = await response.data;
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      setUserList(pList);
      setFilteredUserList(pList);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, refresh the page");
      } else {
        showMessage("Oops! An error occurred. Refresh the page");
      }
    }
    setFlagLoad(false);
  }

  async function handleFormSubmit(user) {
    let message;
    let userForBackEnd = { ...user };
    
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/users",
          userForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedUser = await response.data;
        message = "User added successfully. Password sent to email.";
        let prList = [...userList];
        prList.push(addedUser);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setUserList(prList);
        setFilteredUserList(prList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else if (error.response && error.response.status === 409) {
          showMessage("User with this email already exists");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
      }
      setFlagLoad(false);
    } else if (action == "update") {
      userForBackEnd._id = userToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/users",
          userForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedUser = await response.data;
        
        message = "User updated successfully";
        let prList = userList.map((e, index) => {
          if (e._id == updatedUser._id) return updatedUser;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredUserList.map((e, index) => {
          if (e._id == updatedUser._id) return updatedUser;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setUserList(prList);
        setFilteredUserList(fprList);
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

  function handleEditButtonClick(user) {
    setAction("update");
    setUserToBeEdited(user);
  }

  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }

  function handleDeleteButtonClick(ans, user) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(user);
    }
  }

  async function performDeleteOperation(user) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/users/" + user._id);
      let r = await response.data;
      message = `User - ${user.name || user.emailId} deleted successfully.`;
      let prList = userList.filter((e, index) => e._id != user._id);
      setUserList(prList);
      let fprList = filteredUserList.filter((e, index) => e._id != user._id);
      setFilteredUserList(fprList);
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
    let list = [...filteredUserList];
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
    setFilteredUserList(list);
    setSortedField(field);
  }

  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredUserList];
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
    setFilteredUserList(list);
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
      setFilteredUserList(userList);
      return;
    }
    let searchedUsers = [];
    searchedUsers = filterByShowInListAttributes(query);
    setFilteredUserList(searchedUsers);
  }

  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < userList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            userList[i][parameterName] &&
            String(userList[i][parameterName])
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(userList[i]);
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
      let result = analyseImportExcelSheet(jsonData, userList);
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
          "users",
          userList,
          ""
        );
        if (result.success) {
          setUserList(result.updatedList);
          setFilteredUserList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "users",
          userList,
          ""
        );
        if (result.success) {
          setUserList(result.updatedList);
          setFilteredUserList(result.updatedList);
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
        filteredList={filteredUserList}
        mainList={userList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
      />
      {filteredUserList.length == 0 && userList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add user
            </button>
          )}
          <p>No user to show</p>
        </div>
      )}
      {userList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredUserList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredUserList.length != 0 && (
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
          <AdminUserForm
            userSchema={userSchema}
            userValidations={userValidations}
            emptyUser={emptyUser}
            selectedEntity={selectedEntity}
            userToBeEdited={userToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredUserList.length != 0 &&
        filteredUserList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredUserList.length}
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
