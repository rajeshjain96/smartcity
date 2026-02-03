import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminShopDetailForm from "./AdminShopDetailForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminShopDetails(props) {
  const navigate = useNavigate();
  const selectedEntity = {
    name: "ShopDetails",
    singularName: "ShopDetail",
    dbCollection: "shopDetails",
    addFacility: false,
    deleteFacility: false,
    editFacility: true,
    accessLevel: "A",
  };
  let [shopDetailList, setShopDetailList] = useState([]);
  let [filteredShopDetailList, setFilteredShopDetailList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [shopDetailToBeEdited, setShopDetailToBeEdited] = useState("");
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
  let [showFieldSelectorModal, setShowFieldSelectorModal] = useState(false);
  let { flagFormInvalid } = props;
  let { user: loggedInUser } = props;
  let { onBackButtonClick } = props;
  let shopDetailSchema=[
    {attribute:"shopName",type:"normal",},
    {attribute:"address",type:"normal",},
    {attribute:"mobileNumber",type:"normal",},
    {attribute:"emailId",type:"normal",},
    {attribute:"ownerName",type:"normal",},
    {attribute:"gstNumber",type:"normal",},
    {attribute:"logo",type:"singleFile",allowedFileType:"image",allowedSize:5},
  ]
  let shopDetailValidations={
    shopName:{
      message:"",
      mxLen:100,
      mnLen:1,
      onlyDigits:false
    },
    address:{
      message:"",
      mxLen:500,
      mnLen:1,
      onlyDigits:false
    },
    mobileNumber:{
      message:"",
      mxLen:15,
      mnLen:10,
      onlyDigits:true
    },
    emailId:{
      message:"",
      mxLen:100,
      mnLen:7,
      onlyDigits:false
    },
    ownerName:{
      message:"",
      mxLen:100,
      mnLen:1,
      onlyDigits:false
    },
    gstNumber:{
      message:"",
      mxLen:20,
      mnLen:0,
      onlyDigits:false
    },
    logo:{
      message:"",
      mxLen:100,
      mnLen:0,
      onlyDigits:false
    },
  }
  let [showInList, setShowInList] = useState(getShowInList(shopDetailSchema,cntShow));
  let [emptyShopDetail, setEmptyShopDetail] = useState(getEmptyObject(shopDetailSchema));
  useEffect(() => {
    getData();
  }, []);
  async function getData() {
      setFlagLoad(true);
      try {
        let response = await axios("/shopDetails");
        let pList = await response.data;
        pList = pList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        pList.forEach((shopDetail) => {
})//forEach
setShopDetailList(pList);
      setFilteredShopDetailList(pList);
      
      // If no record exists, automatically show add form
      // If one record exists, show it in update mode directly
      if (pList.length === 0) {
        setAction("add");
        setShopDetailToBeEdited("");
      } else if (pList.length === 1) {
        // One record exists, show form directly in update mode
        setAction("update");
        setShopDetailToBeEdited(pList[0]);
      }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Oops! An error occurred. Refresh the page");
        }
      }
      setFlagLoad(false);
    }
  async function handleFormSubmit(shopDetail) {
    let message;
    let shopDetailForBackEnd = { ...shopDetail };
    for (let key in shopDetailForBackEnd) {
      shopDetailSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete shopDetailForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      setFlagLoad(true);
      try {
        // Add files from original shopDetail to shopDetailForBackEnd
        shopDetailSchema.forEach((e, index) => {
          if (e.type === "singleFile" && shopDetail[`file${index}`] instanceof File) {
            shopDetailForBackEnd[`file${index}`] = shopDetail[`file${index}`];
          }
        });
        console.log("Submitting shopDetailForBackEnd with files:", Object.keys(shopDetailForBackEnd).filter(k => shopDetailForBackEnd[k] instanceof File));
        // Axios will automatically convert objects with File instances to FormData
        let response = await axios.post(
          "/shopDetails",
          shopDetailForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedShopDetail = await response.data;
        for (let key in shopDetail) {
          shopDetailSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedShopDetail[key] = shopDetail[key];
            }
          });
        }
        message = "Shop detail added successfully";
        // Since only one record should exist, replace the list with just this one
        setShopDetailList([addedShopDetail]);
        setFilteredShopDetailList([addedShopDetail]);
        setShopDetailToBeEdited(addedShopDetail);
        showMessage(message);
        setAction("update"); // Switch to update mode after adding
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Something went wrong, refresh the page");
        }
        setFlagLoad(false);
        return;
      }
    }
    else if (action == "update") {
      shopDetailForBackEnd._id = shopDetailToBeEdited._id;
      setFlagLoad(true);
      try {
        // Add files from original shopDetail to shopDetailForBackEnd
        shopDetailSchema.forEach((e, index) => {
          if (e.type === "singleFile" && shopDetail[`file${index}`] instanceof File) {
            shopDetailForBackEnd[`file${index}`] = shopDetail[`file${index}`];
          }
        });
        console.log("Submitting shopDetailForBackEnd with files:", Object.keys(shopDetailForBackEnd).filter(k => shopDetailForBackEnd[k] instanceof File));
        // Axios will automatically convert objects with File instances to FormData
        let response = await axios.put(
          "/shopDetails",
          shopDetailForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedShopDetail = await response.data;
        message = "Shop Details updated successfully";
        let prList = shopDetailList.map((e, index) => {
          if (e._id == updatedShopDetail._id) return updatedShopDetail;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredShopDetailList.map((e, index) => {
          if (e._id == updatedShopDetail._id) return updatedShopDetail;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setShopDetailList(prList);
        setFilteredShopDetailList(fprList);
        setShopDetailToBeEdited(updatedShopDetail);
        showMessage(message);
        // Navigate to dashboard after successful update
        if (onBackButtonClick) {
          setTimeout(() => {
            onBackButtonClick();
          }, 500); // Small delay to show success message
        }
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
    setFlagLoad(false);
  }
  function handleFormCloseClick() {
    // Navigate to dashboard when cancel is clicked
    if (onBackButtonClick) {
      onBackButtonClick();
    } else {
      setAction("list"); // Fallback
    }
  }
  function handleListClick() {
    setAction("list");
  }
  function handleAddEntityClick() {
    setSearchText("");
    setAction("add");
  }
  function handleEditButtonClick(shopDetail) {
    setAction("update");
    setShopDetailToBeEdited(shopDetail);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, shopDetail) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(shopDetail);
    }
  }
  async function performDeleteOperation(shopDetail) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/shopDetails/" + shopDetail._id);
      let r = await response.data;
      message = `Shop detail - ${shopDetail.shopName} deleted successfully.`;
      let prList = shopDetailList.filter((e, index) => e._id != shopDetail._id);
      setShopDetailList(prList);
      let fprList = shopDetailList.filter((e, index) => e._id != shopDetail._id);
      setFilteredShopDetailList(fprList);
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
    let list = [...filteredShopDetailList];
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
    setFilteredShopDetailList(list);
    setSortedField(field);
  }
  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredShopDetailList];
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
    setFilteredShopDetailList(list);
    setSortedField("updateDate");
  }
  function handleFormTextChangeValidations(message, index) {
  }
  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);
    performSearchOperation(searchText);
  }
  function performSearchOperation(searchText) {
    let query = searchText.trim();
    if (query.length == 0) {
      setFilteredShopDetailList(shopDetailList);
      return;
    }
    let searchedShopDetails = [];
    searchedShopDetails = filterByShowInListAttributes(query);
    setFilteredShopDetailList(searchedShopDetails);
  }
  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < shopDetailList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            shopDetailList[i][parameterName] &&
            shopDetailList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(shopDetailList[i]);
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
      showMessage(message);
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
      let result = analyseImportExcelSheet(jsonData, shopDetailList);
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
          "shopDetails",
          shopDetailList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setShopDetailList(result.updatedList);
          setFilteredShopDetailList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "shopDetails",
          shopDetailList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setShopDetailList(result.updatedList);
          setFilteredShopDetailList(result.updatedList);
        }
        showMessage(result.message);
      }
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
    <>
      {/* Fixed Navbar */}
      <nav className="admin-page-navbar">
        <div className="admin-page-navbar-container">
          <button
            className="admin-page-navbar-back-btn"
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <i className="bi bi-arrow-left me-2"></i>
            <span className="admin-page-navbar-back-text">Back to Home</span>
          </button>
          <div className="admin-page-navbar-title">
            <span className="admin-page-navbar-page-name">Shop Details</span>
          </div>
          <div style={{ width: '120px' }}></div> {/* Spacer for alignment */}
        </div>
      </nav>
      
      {/* Content with padding for navbar */}
      <div className="container admin-page-content-wrapper">
      {message && (
        <div className="alert alert-info text-center" role="alert">
          {message}
        </div>
      )}
      {(action == "add" || action == "update") && (
        <div className="row">
          <AdminShopDetailForm
            shopDetailSchema={shopDetailSchema}
            shopDetailValidations={shopDetailValidations}
            emptyShopDetail={emptyShopDetail}
            selectedEntity={selectedEntity}
            shopDetailToBeEdited={shopDetailToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
            loggedInUser={loggedInUser}
          />
        </div>
      )}
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
    </>
  );
}

