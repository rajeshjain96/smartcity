import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import AdminCustomerForm from "./AdminCustomerForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import Modal from "./Modal";
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
import { useEntityAction } from "../contexts/EntityActionContext";

export default function AdminCustomers(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedEntity = {
    name: "Customers",
    singularName: "Customer",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    isReady: true,
    accessLevel: "A",
  };
  let [customerList, setCustomerList] = useState([]);
  let [filteredCustomerList, setFilteredCustomerList] = useState([]);

  const { setAction: setContextAction, setOnListClick } = useEntityAction();
  let [action, setAction] = useState("list");
  let [customerToBeEdited, setCustomerToBeEdited] = useState("");
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
  let [showFieldSelectorModal, setShowFieldSelectorModal] = useState(false);
  let [showAddEnquiryModal, setShowAddEnquiryModal] = useState(false);
  let [newlyAddedCustomer, setNewlyAddedCustomer] = useState(null);
  let { flagFormInvalid } = props;
  let { onNavigateToEntity } = props;
  let customerSchema = [
    { attribute: "name", type: "normal" },
    { attribute: "whatsappNumber", type: "normal" },
    { attribute: "address", type: "normal" },
  ];
  let customerValidations = {
    name: {
      message: "",
      mxLen: 40,
      mnLen: 4,
      onlyDigits: false,
    },
    whatsappNumber: {
      message: "",
      mxLen: 10,
      mnLen: 10,
      onlyDigits: true,
    },
    address: {
      message: "",
      mxLen: 100,
      mnLen: 10,
      onlyDigits: false,
    },
  };
  let [showInList, setShowInList] = useState(
    getShowInList(customerSchema, cntShow)
  );
  let [emptyCustomer, setEmptyCustomer] = useState(
    getEmptyObject(customerSchema)
  );
  useEffect(() => {
    getData();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios( "/customers");
      let pList = await response.data;
      // Arrange products is sorted order as per updateDate
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      
      // Fetch enquiry counts for each customer
      try {
        let enquiriesResponse = await axios("/enquiries");
        let enquiriesList = await enquiriesResponse.data;
        
        // Count enquiries per customer
        pList.forEach((customer) => {
          const enquiryCount = enquiriesList.filter(
            enquiry => String(enquiry.customerId) === String(customer._id)
          ).length;
          customer.enquiryCount = enquiryCount;
        });
      } catch (error) {
        console.error("Error fetching enquiries:", error);
        // If enquiry fetch fails, set count to 0
        pList.forEach((customer) => {
          customer.enquiryCount = 0;
        });
      }
      
      setCustomerList(pList);
      setFilteredCustomerList(pList);
    } catch (error) {
      showMessage("Oops! An error occurred. Refresh the page");
    }
    setFlagLoad(false);
  }

  async function handleFormSubmit(customer) {
    let message;
    // now remove relational data
    let customerForBackEnd = { ...customer };
    for (let key in customerForBackEnd) {
      customerSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete customerForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      // customer = await addCustomerToBackend(customer);
      setFlagLoad(true);
      try {
        let response = await axios.post("/customers", customerForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        let addedCustomer = await response.data; //returned  with id
        // This addedCustomer has id, addDate, updateDate, but the relational data is lost
        // The original customer has got relational data.
        for (let key in customer) {
          customerSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedCustomer[key] = customer[key];
            }
          });
        }
        message = "Customer added successfully";
        // Set enquiry count to 0 for newly added customer
        addedCustomer.enquiryCount = 0;
        // update the customer list now.
        let prList = [...customerList];
        prList.push(addedCustomer);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCustomerList(prList);
        // Since search box is cleared, reset filtered list to show all customers
        setFilteredCustomerList(prList);
        // update the list in sorted order of updateDate
        showMessage(message);
        setAction("list");
        // Show modal asking if user wants to add enquiry for this customer
        setNewlyAddedCustomer(addedCustomer);
        setShowAddEnquiryModal(true);
      } catch (error) {
        console.log(error);
        showMessage("Somecustomer went wrong, refresh the page");
      }
      setFlagLoad(false);
    } //...add
    else if (action == "update") {
      customerForBackEnd._id = customerToBeEdited._id; // The form does not have id field
      setFlagLoad(true);
      try {
        let response = await axios.put("/customers", customerForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        // update the customer list now, relational data is not deleted
        message = "Customer Updated successfully";
        // update the customer list now.
        let prList = customerList.map((e, index) => {
          if (e._id == customer._id) return customer;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredCustomerList.map((e, index) => {
          if (e._id == customer._id) return customer;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setCustomerList(prList);
        setFilteredCustomerList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        showMessage("Somecustomer went wrong, refresh the page");
      }
    } //else ...(update)
    setFlagLoad(false);
  }
  function handleFormCloseClick() {
    setAction("list");
  }
  function handleListClick() {
    setAction("list");
  }

  // Sync action state with context and register handler
  useEffect(() => {
    // Check if filter params are provided in selectedEntity (from AdminContentPage)
    if (selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.autoAdd) {
      setAction("add");
    }
    // Also check location.state.filterParams (when accessed via route)
    else if (location.state?.filterParams?.autoAdd) {
      setAction("add");
    }
  }, [selectedEntity, location.state]);

  useEffect(() => {
    setContextAction(action);
    setOnListClick(() => handleListClick);
  }, [action, setContextAction, setOnListClick]);
  function handleAddEntityClick() {
    setSearchText("");
    setAction("add");
  }
  function handleEditButtonClick(customer) {
    setAction("update");
    setCustomerToBeEdited(customer);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, customer) {
    if (ans == "No") {
      // delete operation cancelled
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      // delete operation allowed
      performDeleteOperation(customer);
    }
  }
  async function performDeleteOperation(customer) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/customers/" + customer._id);
      let r = await response.data;
      message = `Customer - ${customer.name} deleted successfully.`;
      //update the customer list now.
      let prList = customerList.filter((e, index) => e._id != customer._id);
      setCustomerList(prList);

      let fprList = customerList.filter((e, index) => e._id != customer._id);
      setFilteredCustomerList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      showMessage("Somecustomer went wrong, refresh the page");
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
  function handleWhatsAppClick(whatsappNumber) {
    if (!whatsappNumber) {
      return;
    }
    
    try {
      // Convert to string first (in case it's a number from Excel)
      let phoneStr = String(whatsappNumber);
      
      // Handle scientific notation (e.g., 9.87654E+09) that might come from Excel
      if (phoneStr.includes('e') || phoneStr.includes('E')) {
        phoneStr = String(parseFloat(phoneStr).toFixed(0));
      }
      
      // Remove decimal point if present (e.g., 9876543210.0 from Excel)
      if (phoneStr.includes('.')) {
        phoneStr = phoneStr.split('.')[0];
      }
      
      // Remove any non-digit characters (spaces, dashes, brackets, +, etc.)
      let phoneNumber = phoneStr.replace(/\D/g, '');
      
      // Handle different phone number formats:
      // - 10 digits: add country code 91 (e.g., 9876543210 -> 919876543210)
      // - 12 digits starting with 91: use as-is (e.g., 919876543210)
      // - 11 digits starting with 0: remove leading 0 and add 91 (e.g., 09876543210 -> 919876543210)
      // - Other lengths: try to use as-is if it looks valid
      
      if (phoneNumber.length === 10) {
        // 10-digit Indian number - add country code
        phoneNumber = '91' + phoneNumber;
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith('0')) {
        // 11-digit number starting with 0 - remove 0 and add country code
        phoneNumber = '91' + phoneNumber.substring(1);
      } else if (phoneNumber.length === 12 && phoneNumber.startsWith('91')) {
        // Already has country code - use as-is
        // phoneNumber is already correct
      } else if (phoneNumber.length < 10 || phoneNumber.length > 15) {
        // Invalid length - show error
        alert(`Invalid WhatsApp number format. Phone number has ${phoneNumber.length} digits. Expected 10-12 digits for Indian numbers.`);
        return;
      }
      // For other valid lengths (11-15 digits), try to use as-is
      
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      alert('Failed to open WhatsApp. Please check the phone number.');
    }
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
    let list = [...filteredCustomerList];
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
    setFilteredCustomerList(list);
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
    let list = [...filteredCustomerList];
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
    setFilteredCustomerList(list);
    setSortedField("updateDate");
  }
  
  function handleNavigateToEntity(entityName, filterParams = null) {
    // If onNavigateToEntity prop is available, use it
    if (onNavigateToEntity) {
      onNavigateToEntity(entityName, filterParams);
    } else {
      // Otherwise, navigate directly using react-router
      const entityNameLower = entityName.toLowerCase();
      navigate(`/${entityNameLower}`, { 
        state: { 
          filterParams: filterParams || null
        } 
      });
    }
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
      setFilteredCustomerList(customerList);
      return;
    }
    let searchedCustomers = [];
    searchedCustomers = filterByShowInListAttributes(query);
    setFilteredCustomerList(searchedCustomers);
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
    for (let i = 0; i < customerList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            customerList[i][parameterName] &&
            customerList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(customerList[i]);
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
      // Normalize phone numbers from Excel (they might be stored as numbers)
      jsonData.forEach((record) => {
        if (record.whatsappNumber !== undefined && record.whatsappNumber !== null) {
          // Convert to string and handle scientific notation or decimal numbers
          let phoneStr = String(record.whatsappNumber);
          // If it's in scientific notation (e.g., 9.87654E+09), convert it
          if (phoneStr.includes('e') || phoneStr.includes('E')) {
            phoneStr = String(parseFloat(phoneStr).toFixed(0));
          }
          // Remove decimal point if present (e.g., 9876543210.0)
          if (phoneStr.includes('.')) {
            phoneStr = phoneStr.split('.')[0];
          }
          record.whatsappNumber = phoneStr;
        }
      });
      // const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      setSheetData(jsonData);
      let result = analyseImportExcelSheet(jsonData, customerList);
      if (result.message) {
        showMessage(result.message);
      } else {
        showImportAnalysis(result);
      }
      // analyseSheetData(jsonData, customerList);
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
          "customers",
          customerList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setCustomerList(result.updatedList);
          setFilteredCustomerList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "customers",
          customerList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setCustomerList(result.updatedList);
          setFilteredCustomerList(result.updatedList);
        }
        showMessage(result.message);
      } //if
    } catch (error) {
      console.log(error);
      showMessage("Somecustomer went wrong, refresh the page");
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
            onClick={() => navigate('/', { state: location.state })}
            title="Back to Home"
          >
            <i className="bi bi-arrow-left me-2"></i>
            <span className="admin-page-navbar-back-text">Back to Home</span>
          </button>
          <div className="admin-page-navbar-title">
            <span className="admin-page-navbar-page-name">Customers</span>
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
        filteredList={filteredCustomerList}
        mainList={customerList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        searchText={searchText}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {action == "list" && filteredCustomerList.length == 0 && customerList.length != 0 && (
        <div className="empty-state-container">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-3"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add customer
            </button>
          )}
          <div className="empty-state-icon">
            <i className="bi bi-search"></i>
          </div>
          <h5 className="empty-state-title">No customers found</h5>
          <p className="empty-state-message">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
      {action == "list" && customerList.length == 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h5 className="empty-state-title">No customers yet</h5>
          <p className="empty-state-message">
            Get started by adding your first customer using the + button above.
          </p>
        </div>
      )}
      {action == "list" && filteredCustomerList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
          onSelectClick={handleSelectClick}
        />
      )}
      {action == "list" && filteredCustomerList.length != 0 && (
        <div className="row mb-1 mx-auto px-2 py-1 bg-light rounded list-header-row">
          <div className="col-1">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSrNoClick();
              }}
              className={`list-header-link ${sortedField == "updateDate" ? "active" : ""}`}
            >
              <span className="list-header-text">SN.</span>
              {sortedField == "updateDate" && (
                <span className="list-header-sort-icon">
                  {direction ? (
                    <i className="bi bi-arrow-up-short"></i>
                  ) : (
                    <i className="bi bi-arrow-down-short"></i>
                  )}
                </span>
              )}
              {sortedField != "updateDate" && (
                <span className="list-header-sort-icon inactive">
                  <i className="bi bi-arrow-down-up"></i>
                </span>
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
          <AdminCustomerForm
            customerSchema={customerSchema}
            customerValidations={customerValidations}
            emptyCustomer={emptyCustomer}
            selectedEntity={selectedEntity}
            customerToBeEdited={customerToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
          />
        </div>
      )}
      {action == "list" &&
        filteredCustomerList.length != 0 &&
        filteredCustomerList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredCustomerList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
            customerWhatsappNumber={e.whatsappNumber}
            onWhatsAppClick={handleWhatsAppClick}
            onNavigateToEntity={handleNavigateToEntity}
            customerId={e._id}
            customerName={e.name}
            customerWhatsappNumberForMenu={e.whatsappNumber}
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
      {showAddEnquiryModal && newlyAddedCustomer && (
        <Modal
          heading="Customer Added Successfully"
          modalText={`${newlyAddedCustomer.name} added successfully. Want to add this to enquiry?`}
          btnGroup={["Yes", "No"]}
          onModalCloseClick={() => {
            setShowAddEnquiryModal(false);
            setNewlyAddedCustomer(null);
          }}
          onModalButtonClick={async (answer) => {
            if (answer === "Yes") {
              // Create enquiry with default values directly
              setFlagLoad(true);
              try {
                const enquiryData = {
                  customerId: newlyAddedCustomer._id,
                  status: "in-process",
                  code: "" // Backend will auto-generate
                };
                
                let response = await axios.post("/enquiries", enquiryData, {
                  headers: { "Content-type": "multipart/form-data" },
                });
                
                // Navigate to Enquiries with this customer filter to show the list
                handleNavigateToEntity("Enquiries", {
                  customerId: newlyAddedCustomer._id,
                  customerName: newlyAddedCustomer.name,
                  customerWhatsappNumber: newlyAddedCustomer.whatsappNumber
                  // No autoAdd flag - just show the filtered list
                });
              } catch (error) {
                console.log(error);
                showMessage("Failed to add enquiry. Please try again.");
              }
              setFlagLoad(false);
            }
            setShowAddEnquiryModal(false);
            setNewlyAddedCustomer(null);
          }}
        />
      )}
      </div>
    </>
  );
}
