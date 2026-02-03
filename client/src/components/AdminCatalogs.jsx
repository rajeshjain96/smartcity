import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminCatalogForm from "./AdminCatalogForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";

export default function AdminCatalogs(props) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get selectedEntity from props if available (from AdminContentPage), otherwise create default
  let selectedEntity = props.selectedEntity || {
    name: "Catalogs",
    singularName: "Catalog",
    dbCollection: "catalogs",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    accessLevel: "A",
  };
  
  // Create a copy to avoid mutating the original
  selectedEntity = { ...selectedEntity };
  
  // If filterParams are in location state, merge them into selectedEntity
  if (location.state?.filterParams && !selectedEntity.filterParams) {
    selectedEntity.filterParams = location.state.filterParams;
  }
  let [catalogList, setCatalogList] = useState([]);
  let [filteredCatalogList, setFilteredCatalogList] = useState([]);
  let [companyList, setCompanyList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [catalogToBeEdited, setCatalogToBeEdited] = useState("");
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
  let catalogSchema=[
    {attribute:"companyId",type:"relationalId",},
    {attribute:"company",type:"normal",relationalData: true,list: "companylist",relatedId: "companyId",},
    {attribute:"name",type:"normal",},
    {attribute:"priceInRs",type:"normal",label:"Price in Rs (per meter)",},
  ]
  let catalogValidations={
    name:{
      message:"",
      mxLen:50,
      mnLen:1,
      onlyDigits:false
    },
    companyId:{
      message:"",
      mxLen:50,
      mnLen:1,
      onlyDigits:false
    },
    company:{
      message:"",
      mxLen:100,
      mnLen:1,
      onlyDigits:false
    },
    priceInRs:{
      message:"",
      mxLen:20,
      mnLen:1,
      onlyDigits:true
    },
  }
  let [showInList, setShowInList] = useState(getShowInList(catalogSchema,cntShow));
  let [emptyCatalog, setEmptyCatalog] = useState(getEmptyObject(catalogSchema));
  let [companyIdFilter, setCompanyIdFilter] = useState(null);
  const [filterParamsInitialized, setFilterParamsInitialized] = useState(false);
  
  useEffect(() => {
    // Check if filter params are provided in selectedEntity
    // Same pattern as AdminEnquiries - only set filter and search text, don't call getData here
    // Only initialize once to avoid overwriting user input
    if (!filterParamsInitialized && selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.companyId) {
      setCompanyIdFilter(String(selectedEntity.filterParams.companyId));
      
      // Set search text with company name
      if (selectedEntity.filterParams.companyName) {
        setSearchText(selectedEntity.filterParams.companyName);
      } else {
        setSearchText("");
      }
      
      setFilterParamsInitialized(true);
    } else if (!filterParamsInitialized && (!selectedEntity || !selectedEntity.filterParams || !selectedEntity.filterParams.companyId)) {
      setCompanyIdFilter(null);
      setSearchText("");
      setFilterParamsInitialized(true);
    }
  }, [selectedEntity, filterParamsInitialized]);
  
  useEffect(() => {
    // Only call getData if companyIdFilter has been initialized (not undefined)
    // This prevents unnecessary calls during initial render
    // Same pattern as AdminEnquiries
    if (companyIdFilter !== undefined) {
      getData();
    }
  }, [companyIdFilter]);
  
  // Trigger search after data is loaded and searchText is set
  // Same pattern as AdminEnquiries - only trigger search when searchText exists
  // When searchText is empty, performSearchOperation handles it directly via handleSearchKeyUp
  useEffect(() => {
    if (searchText && catalogList.length > 0) {
      // Use a small delay to ensure filteredCatalogList is ready
      const timer = setTimeout(() => {
        performSearchOperation(searchText);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [catalogList, searchText]);
  
  
  
  async function getData() {
      // Use state value directly - same pattern as AdminEnquiries
      const filterToUse = companyIdFilter;
      console.log("[AdminCatalogs] getData called with filter:", filterToUse);
      
      setFlagLoad(true);
      try {
        // Build URL with companyId query parameter if filter is active
        let url = "/catalogs";
        if (filterToUse) {
          url += `?companyId=${filterToUse}`;
        }
        let response = await axios(url);
        let pList = await response.data;
        
        console.log("[AdminCatalogs] Fetched catalogs from backend:", {
          companyIdFilter: filterToUse,
          catalogCount: pList.length
        });
        
        // Only fetch companies if we don't have companyId filter (we already have company info from filterParams)
        let companyListData = [];
        if (!filterToUse) {
          response = await axios("/companies");
          companyListData = await response.data;
          setCompanyList(companyListData);
        } else {
          // When filtering by company, use the company info from filterParams
          if (selectedEntity && selectedEntity.filterParams) {
            const companyInfo = {
              _id: selectedEntity.filterParams.companyId,
              name: selectedEntity.filterParams.companyName || ""
            };
            companyListData = [companyInfo];
            setCompanyList(companyListData);
          }
        }
        
        pList = pList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        // update pList with relational-data
        pList.forEach((catalog) => {
          for (let i = 0; i < companyListData.length; i++) {
            if (catalog.companyId == companyListData[i]._id) {
              catalog.company = companyListData[i].name || "";
              break;
            }
          }
        });
        // Since we pass filterToUse as a parameter, we can trust it
        // The state might not have updated yet due to React's async state updates,
        // but the parameter represents the filter we actually want to use
        console.log("[AdminCatalogs] getData completed:", {
          catalogListLength: pList.length,
          filterUsed: filterToUse,
          currentStateFilter: companyIdFilter,
          searchText
        });
        
        // Update lists with the fetched data
        // Backend already filtered by companyId if filter is set, so use pList directly
        // Same pattern as AdminEnquiries
        setCatalogList(pList);
        setFilteredCatalogList(pList);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          showMessage("Session expired, refresh the page");
        } else {
          showMessage("Oops! An error occurred. Refresh the page");
        }
      }
      setFlagLoad(false);
    }
  async function handleFormSubmit(catalog) {
    let message;
    let catalogForBackEnd = { ...catalog };
    for (let key in catalogForBackEnd) {
      catalogSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete catalogForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post(
          "/catalogs",
          catalogForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let addedCatalog = await response.data;
        for (let key in catalog) {
          catalogSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedCatalog[key] = catalog[key];
            }
          });
        }
        // Enrich with company name
        if (addedCatalog.companyId && companyList.length > 0) {
          const company = companyList.find(c => c._id === addedCatalog.companyId);
          if (company) {
            addedCatalog.company = company.name || "";
          }
        }
        message = "Catalog added successfully";
        let prList = [...catalogList];
        prList.push(addedCatalog);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCatalogList(prList);
        // Since search box is cleared, reset filtered list to show all catalogs
        setFilteredCatalogList(prList);
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
      catalogForBackEnd._id = catalogToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put(
          "/catalogs",
          catalogForBackEnd,
          { headers: { "Content-type": "multipart/form-data" } }
        );
        let updatedCatalog = await response.data;
        // Enrich with company name
        if (updatedCatalog.companyId && companyList.length > 0) {
          const company = companyList.find(c => c._id === updatedCatalog.companyId);
          if (company) {
            updatedCatalog.company = company.name || "";
          }
        }
        message = "Catalog Updated successfully";
        let prList = catalogList.map((e, index) => {
          if (e._id == updatedCatalog._id) return updatedCatalog;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredCatalogList.map((e, index) => {
          if (e._id == updatedCatalog._id) return updatedCatalog;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCatalogList(prList);
        setFilteredCatalogList(fprList);
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
  function handleEditButtonClick(catalog) {
    setAction("update");
    setCatalogToBeEdited(catalog);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, catalog) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(catalog);
    }
  }
  async function performDeleteOperation(catalog) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/catalogs/" + catalog._id);
      let r = await response.data;
      message = `Catalog - ${catalog.name} deleted successfully.`;
      let prList = catalogList.filter((e, index) => e._id != catalog._id);
      setCatalogList(prList);
      let fprList = catalogList.filter((e, index) => e._id != catalog._id);
      setFilteredCatalogList(fprList);
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
    let list = [...filteredCatalogList];
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
    setFilteredCatalogList(list);
    setSortedField(field);
  }
  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredCatalogList];
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
    setFilteredCatalogList(list);
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
    let query = searchText ? searchText.trim() : "";
    if (query.length == 0) {
      // Restore to filtered list (which is already filtered by companyId if filter is active)
      // Same pattern as AdminEnquiries - shows all records for the current filter
      // If companyIdFilter is active, catalogList contains only that company's catalogs
      // If no filter, catalogList contains all catalogs
      setFilteredCatalogList(catalogList);
      return;
    }
    let searchedCatalogs = [];
    searchedCatalogs = filterByShowInListAttributes(query);
    setFilteredCatalogList(searchedCatalogs);
  }
  function filterByShowInListAttributes(query) {
    let fList = [];
    // Backend already filtered by companyId if filter is active, so search in catalogList
    // Same pattern as AdminEnquiries
    for (let i = 0; i < catalogList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          let fieldValue = catalogList[i][parameterName];
          if (fieldValue != null && fieldValue !== undefined) {
            // Convert to string for comparison (handles numbers, strings, etc.)
            let fieldValueStr = String(fieldValue).toLowerCase();
            if (fieldValueStr.includes(query.toLowerCase())) {
              fList.push(catalogList[i]);
              break;
            }
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
      let result = analyseImportExcelSheet(jsonData, catalogList);
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
  
  // Convert company names to companyIds for Excel-imported records
  function convertCompanyNamesToIds(records, companiesList) {
    if (!records || records.length === 0 || !companiesList || companiesList.length === 0) {
      return records;
    }
    
    return records.map((record) => {
      // If record has company name but no companyId, find the matching companyId
      if (record.company && !record.companyId) {
        const matchingCompany = companiesList.find(
          (c) => c.name && record.company &&
            c.name.trim().toLowerCase() === record.company.trim().toLowerCase()
        );
        if (matchingCompany && matchingCompany._id) {
          record.companyId = matchingCompany._id;
          console.log(`[AdminCatalogs] Converted company "${record.company}" to companyId: ${matchingCompany._id}`);
        } else {
          console.warn(`[AdminCatalogs] Could not find companyId for company name: "${record.company}"`);
        }
      }
      return record;
    });
  }
  
  async function handleImportButtonClick() {
    setFlagImport(false);
    setFlagLoad(true);
    let result;
    try {
      // Ensure we have companyList before processing - fetch if needed
      let companiesListToUse = companyList;
      if (companiesListToUse.length === 0) {
        const response = await axios("/companies");
        companiesListToUse = await response.data;
        setCompanyList(companiesListToUse);
      }
      
      // Convert company names to companyIds before sending to backend
      let recordsToAdd = recordsToBeAdded.length > 0 
        ? convertCompanyNamesToIds([...recordsToBeAdded], companiesListToUse) 
        : [];
      let recordsToUpdate = recordsToBeUpdated.length > 0 
        ? convertCompanyNamesToIds([...recordsToBeUpdated], companiesListToUse) 
        : [];
      
      if (recordsToAdd.length > 0) {
        result = await recordsAddBulk(
          recordsToAdd,
          "catalogs",
          catalogList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          showMessage(result.message);
        }
      }
      if (recordsToUpdate.length > 0) {
        result = await recordsUpdateBulk(
          recordsToUpdate,
          "catalogs",
          catalogList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          showMessage(result.message);
        }
      }
      // Refresh catalog list from server after import to ensure all data is up-to-date
      // This ensures catalog counts in AdminCompanies will be accurate
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
            <span className="admin-page-navbar-page-name">Catalogs</span>
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
        filteredList={filteredCatalogList}
        mainList={catalogList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        searchText={searchText}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {filteredCatalogList.length == 0 && catalogList.length != 0 && (
        <div className="text-center">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-2"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add catalog
            </button>
          )}
          <p>No catalog to show</p>
        </div>
      )}
      {catalogList.length == 0 && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredCatalogList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredCatalogList.length != 0 && (
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
          <AdminCatalogForm
            catalogSchema={catalogSchema}
            catalogValidations={catalogValidations}
            emptyCatalog={emptyCatalog}
            selectedEntity={selectedEntity}
            catalogToBeEdited={catalogToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            companyList={companyList}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredCatalogList.length != 0 &&
        filteredCatalogList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredCatalogList.length}
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
    </>
  );
}

