import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminCompanyForm from "./AdminCompanyForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminCompanies(props) {
  const navigate = useNavigate();
  const selectedEntity = {
    name: "Companies",
    singularName: "Company",
    dbCollection: "companies",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    accessLevel: "A",
  };
  let [companyList, setCompanyList] = useState([]);
  let [filteredCompanyList, setFilteredCompanyList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [companyToBeEdited, setCompanyToBeEdited] = useState("");
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
  let companySchema=[
    {attribute:"name",type:"normal",},
    {attribute:"description",type:"text-area",},
  ]
  let companyValidations={
    name:{
      message:"",
      mxLen:100,
      mnLen:1,
      onlyDigits:false
    },
    description:{
      message:"",
      mxLen:500,
      mnLen:0,
      onlyDigits:false
    },
  }
  let [showInList, setShowInList] = useState(getShowInList(companySchema, cntShow));
  let [emptyCompany, setEmptyCompany] = useState(getEmptyObject(companySchema));
  useEffect(() => {
    // Refresh data when component mounts
    // This ensures catalog counts are up-to-date
    getData();
  }, []); // Empty dependency array - only run on mount
  async function getData() {
      setFlagLoad(true);
      try {
        let response = await axios("/companies");
        let pList = await response.data;
        pList = pList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        
        // Catalog counts are now included in the backend response
        // Ensure catalogCount is set (default to 0 if not present)
        pList.forEach((company) => {
          if (company.catalogCount === undefined) {
            company.catalogCount = 0;
          }
        });
        
        setCompanyList(pList);
        setFilteredCompanyList(pList);
      } catch (error) {
        showMessage("Oops! An error occurred. Refresh the page");
      }
      setFlagLoad(false);
    }
  async function handleFormSubmit(company) {
    let message;
    let companyForBackEnd = { ...company };
    for (let key in companyForBackEnd) {
      companySchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete companyForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/companies",
          companyForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedCompany = await response.data;
        for (let key in company) {
          companySchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedCompany[key] = company[key];
            }
          });
        }
        message = "Company added successfully";
        // Set catalog count to 0 for newly added company
        addedCompany.catalogCount = 0;
        let prList = [...companyList];
        prList.push(addedCompany);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCompanyList(prList);
        // Since search box is cleared, reset filtered list to show all companies
        setFilteredCompanyList(prList);
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
    else if (action == "update") {
      companyForBackEnd._id = companyToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/companies",
          companyForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedCompany = await response.data;
        // Preserve catalogCount from existing company data
        const existingCompany = companyList.find(c => c._id === updatedCompany._id);
        if (existingCompany && existingCompany.catalogCount !== undefined) {
          updatedCompany.catalogCount = existingCompany.catalogCount;
        }
        message = "Company Updated successfully";
        let prList = companyList.map((e, index) => {
          if (e._id == updatedCompany._id) return updatedCompany;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredCompanyList.map((e, index) => {
          if (e._id == updatedCompany._id) return updatedCompany;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCompanyList(prList);
        setFilteredCompanyList(fprList);
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
    setFlagLoad(false);
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
  function handleEditButtonClick(company) {
    setAction("update");
    setCompanyToBeEdited(company);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, company) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(company);
    }
  }
  async function performDeleteOperation(company) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/companies/" + company._id);
      let r = await response.data;
      message = `Company - ${company.name} deleted successfully.`;
      let prList = companyList.filter((e, index) => e._id != company._id);
      setCompanyList(prList);
      let fprList = companyList.filter((e, index) => e._id != company._id);
      setFilteredCompanyList(fprList);
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
    let list = [...filteredCompanyList];
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
    setFilteredCompanyList(list);
    setSortedField(field);
  }
  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredCompanyList];
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
    setFilteredCompanyList(list);
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
      setFilteredCompanyList(companyList);
      return;
    }
    let searchedCompanies = [];
    searchedCompanies = filterByShowInListAttributes(query);
    setFilteredCompanyList(searchedCompanies);
  }
  function filterByShowInListAttributes(query) {
    let fList = [];
    for (let i = 0; i < companyList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            companyList[i][parameterName] &&
            companyList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(companyList[i]);
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
      let result = analyseImportExcelSheet(jsonData, companyList);
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
          "companies",
          companyList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setCompanyList(result.updatedList);
          setFilteredCompanyList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "companies",
          companyList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setCompanyList(result.updatedList);
          setFilteredCompanyList(result.updatedList);
        }
        showMessage(result.message);
      }
      // Refresh company list from server after import to ensure catalog counts are accurate
      await getData();
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
            <span className="admin-page-navbar-page-name">Companies</span>
          </div>
          <div style={{ width: '120px' }}></div> {/* Spacer for alignment */}
        </div>
      </nav>
      
      {/* Content with padding for navbar */}
      <div className="container admin-page-content-wrapper">
      <CommonUtilityBar
        action={action}
        message={message}
        selectedEntity={selectedEntity}
        filteredList={filteredCompanyList}
        mainList={companyList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        searchText={searchText}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {filteredCompanyList.length == 0 && companyList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add company
            </button>
          )}
          <p>No company to show</p>
        </div>
      )}
      {companyList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredCompanyList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredCompanyList.length != 0 && (
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
          <AdminCompanyForm
            companySchema={companySchema}
            companyValidations={companyValidations}
            emptyCompany={emptyCompany}
            selectedEntity={selectedEntity}
            companyToBeEdited={companyToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredCompanyList.length != 0 &&
        filteredCompanyList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredCompanyList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            companyId={e._id}
            companyName={e.name}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
            onNavigateToEntity={props.onNavigateToEntity}
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
    </>
  );
}

