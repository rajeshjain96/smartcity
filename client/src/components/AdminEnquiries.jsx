import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminEnquiryForm from "./AdminEnquiryForm";
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
import { useEntityAction } from "../contexts/EntityActionContext";

export default function AdminEnquiries(props) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get selectedEntity from props if available (from AdminContentPage), otherwise create default
  let selectedEntity = props.selectedEntity || {
    name: "Enquiries",
    singularName: "Enquiry",
    addFacility: true,
    deleteFacility: true,
    editFacility: true,
    isReady: true,
    accessLevel: "A",
  };
  
  // Create a copy to avoid mutating the original
  selectedEntity = { ...selectedEntity };
  
  // If filterParams are in location state, merge them into selectedEntity
  if (location.state?.filterParams && !selectedEntity.filterParams) {
    selectedEntity.filterParams = location.state.filterParams;
  }
  let [enquiryList, setEnquiryList] = useState([]);
  let [filteredEnquiryList, setFilteredEnquiryList] = useState([]);

        let [customerList, setCustomerList] = useState([]);
      
  const { setAction: setContextAction, setOnListClick } = useEntityAction();
  let [action, setAction] = useState("list");
  let [enquiryToBeEdited, setEnquiryToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [flagImport, setFlagImport] = useState(false);
  let [message, setMessage] = useState("");
  let [showCustomerModal, setShowCustomerModal] = useState(false);
  let [selectedCustomer, setSelectedCustomer] = useState(null);
  let [showFieldSelectorModal, setShowFieldSelectorModal] = useState(false);
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
  let { flagFormInvalid } = props;
  let enquirySchema=[
{attribute:"customerId",type:"relationalId",},
{attribute:"customer",type:"normal",relationalData: true,list: "customerlist",relatedId: "customerId",},
{attribute:"status",type:"normal",},
{attribute:"code",type:"normal",},
]
  let enquiryValidations={
customerId:{
    message:"",
    mxLen:10,
    mnLen:4,
    onlyDigits:false
  },customer:{
    message:"",
    mxLen:10,
    mnLen:4,
    onlyDigits:false
  },code:{
    message:"",
    mxLen:20,
    mnLen:8,
    onlyDigits:false
  },status:{
    message:"",
    mxLen:20,
    mnLen:3,
    onlyDigits:false
  },}
  let [showInList, setShowInList] = useState(
    getShowInList(enquirySchema, cntShow)
  );
  let [emptyEnquiry, setEmptyEnquiry] = useState(getEmptyObject(enquirySchema));
  let [customerIdFilter, setCustomerIdFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.customerId 
      ? String(selectedEntity.filterParams.customerId) 
      : null
  );
  
  // Track if we've initialized from filterParams to prevent overwriting user input
  const [filterParamsInitialized, setFilterParamsInitialized] = useState(false);
  
  useEffect(() => {
    // Check if filter params are provided in selectedEntity
    // Only initialize once to avoid overwriting user input
    if (!filterParamsInitialized && selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.customerId) {
      setCustomerIdFilter(String(selectedEntity.filterParams.customerId));
      
      // Set search text with customer name and whatsapp number in brackets
      if (selectedEntity.filterParams.customerName || selectedEntity.filterParams.customerWhatsappNumber) {
        const customerName = selectedEntity.filterParams.customerName || "";
        const whatsappNumber = selectedEntity.filterParams.customerWhatsappNumber || "";
        let searchValue = customerName;
        if (whatsappNumber) {
          searchValue = `${customerName} (${whatsappNumber})`;
        }
        setSearchText(searchValue);
      } else {
        // If in quick mode but no customer name provided, still set searchText to empty to show search box
        setSearchText("");
      }
      
      // Auto-open add form if autoAdd flag is set
      if (selectedEntity.filterParams.autoAdd) {
        setAction("add");
      }
      
      setFilterParamsInitialized(true);
    } else if (!filterParamsInitialized && (!selectedEntity || !selectedEntity.filterParams || !selectedEntity.filterParams.customerId)) {
      setCustomerIdFilter(null);
      // Clear search text when not in quick mode
      setSearchText("");
      setFilterParamsInitialized(true);
    }
  }, [selectedEntity, filterParamsInitialized]);
  
  useEffect(() => {
    // Only call getData if customerIdFilter has been initialized (not undefined)
    // This prevents unnecessary calls during initial render
    if (customerIdFilter !== undefined) {
      getData();
    }
  }, [customerIdFilter]);
  
  // Trigger search after data is loaded and searchText is set
  useEffect(() => {
    if (searchText && enquiryList.length > 0) {
      // Use a small delay to ensure filteredEnquiryList is ready
      const timer = setTimeout(() => {
        performSearchOperation(searchText);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [enquiryList, searchText]);
  
  async function getData() {
      setFlagLoad(true);
      try {
        // Build query string with customerId if filter is active
        let url = "/enquiries";
        if (customerIdFilter) {
          url += `?customerId=${customerIdFilter}`;
        }
        let response = await axios(url);
        let pList = await response.data;
        
        // Only fetch customers if we don't have customerId filter (we already have customer info from filterParams)
        let list2 = [];
        if (!customerIdFilter) {
          response = await axios("/customers");
          list2 = await response.data;
          setCustomerList(list2);
        } else {
          // When filtering by customer, use the customer info from filterParams
          // Create a minimal customer list with just the filtered customer
          if (selectedEntity && selectedEntity.filterParams) {
            const customerInfo = {
              _id: selectedEntity.filterParams.customerId,
              name: selectedEntity.filterParams.customerName || "",
              whatsappNumber: selectedEntity.filterParams.customerWhatsappNumber || ""
            };
            list2 = [customerInfo];
            setCustomerList(list2);
          }
        }
        
    // Arrange products is sorted order as per updateDate
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
    // update pList with relational-data
      pList.forEach((enquiry) => {
for (let i = 0; i < list2.length; i++) {
        if (enquiry.customerId == list2[i]._id) {
          // Format customer name with WhatsApp number in brackets
          const customerName = list2[i].name || "";
          const whatsappNumber = list2[i].whatsappNumber || "";
          // Store WhatsApp number in enquiry for WhatsApp button
          enquiry.customerWhatsappNumber = whatsappNumber;
          if (whatsappNumber) {
            enquiry.customer = `${customerName} (${whatsappNumber})`;
          } else {
            enquiry.customer = customerName;
          }
          break;
        }//if
      }//for
})//forEach
      
      // Fetch measurement counts for each enquiry
      try {
        let measurementsResponse = await axios("/measurements");
        let measurementsList = await measurementsResponse.data;
        
        // Count measurements per enquiry
        pList.forEach((enquiry) => {
          const measurementCount = measurementsList.filter(
            measurement => String(measurement.enquiryId) === String(enquiry._id)
          ).length;
          enquiry.measurementCount = measurementCount;
        });
      } catch (error) {
        console.error("Error fetching measurements:", error);
        // If measurement fetch fails, set count to 0
        pList.forEach((enquiry) => {
          enquiry.measurementCount = 0;
        });
      }
      
      // Backend already filtered by customerId if filter is set, so use pList directly
      setEnquiryList(pList);
      setFilteredEnquiryList(pList);
    } catch (error) {
        showMessage("Oops! An error occurred. Refresh the page");
      }
      setFlagLoad(false);
    }
  
  async function handleFormSubmit(enquiry) {
    let message;
    // now remove relational data
    let enquiryForBackEnd = { ...enquiry };
    for (let key in enquiryForBackEnd) {
      enquirySchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete enquiryForBackEnd[key];
        }
      });
    }
    if (action == "add") {
      // Clear code field - it will be auto-generated by backend
      if (!enquiryForBackEnd.code || enquiryForBackEnd.code.trim() === '') {
        enquiryForBackEnd.code = '';
      }
      // enquiry = await addEnquiryToBackend(enquiry);
      setFlagLoad(true);
      try {
        let response = await axios.post("/enquiries", enquiryForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        let addedEnquiry = await response.data; //returned  with id
        // This addedEnquiry has id, addDate, updateDate, but the relational data is lost
        // The original enquiry has got relational data.
        for (let key in enquiry) {
          enquirySchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedEnquiry[key] = enquiry[key];
            }
          });
        }
        // Enrich with customer WhatsApp number for WhatsApp button
        if (addedEnquiry.customerId && customerList.length > 0) {
          const customer = customerList.find(c => c._id === addedEnquiry.customerId);
          if (customer) {
            const whatsappNumber = customer.whatsappNumber || "";
            addedEnquiry.customerWhatsappNumber = whatsappNumber;
          }
        }
        message = "Enquiry added successfully";
        // Set measurement count to 0 for newly added enquiry
        addedEnquiry.measurementCount = 0;
        // update the enquiry list now.
        let prList = [...enquiryList];
        prList.push(addedEnquiry);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setEnquiryList(prList);
        // Since search box is cleared, reset filtered list to show all enquiries
        setFilteredEnquiryList(prList);
        // update the list in sorted order of updateDate
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        showMessage("Someenquiry went wrong, refresh the page");
      }
      setFlagLoad(false);
    } //...add
    else if (action == "update") {
      enquiryForBackEnd._id = enquiryToBeEdited._id; // The form does not have id field
      setFlagLoad(true);
      try {
        let response = await axios.put("/enquiries", enquiryForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        // update the enquiry list now, relational data is not deleted
        message = "Enquiry Updated successfully";
        // update the enquiry list now.
        let prList = enquiryList.map((e, index) => {
          if (e._id == enquiry._id) return enquiry;
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredEnquiryList.map((e, index) => {
          if (e._id == enquiry._id) return enquiry;
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setEnquiryList(prList);
        setFilteredEnquiryList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        showMessage("Someenquiry went wrong, refresh the page");
      }
    } //else ...(update)
    setFlagLoad(false);
  }
  function handleFormCloseClick() {
    setAction("list");
  }
  function handleCustomerClick(customerId) {
    // Find the customer from customerList
    const customer = customerList.find(c => c._id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setShowCustomerModal(true);
    }
  }
  function handleCustomerModalClose() {
    setShowCustomerModal(false);
    setSelectedCustomer(null);
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
  function handleListClick() {
    setAction("list");
  }

  // Sync action state with context and register handler
  useEffect(() => {
    setContextAction(action);
    setOnListClick(() => handleListClick);
  }, [action, setContextAction, setOnListClick]);
  function generateEnquiryCode() {
    const now = new Date();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const prefix = `${month}${year}-`;
    
    // Find the last enquiry with a code matching this month/year pattern
    const regex = new RegExp(`^${prefix}\\d+$`);
    let sequenceNumber = 1;
    
    // Filter enquiries that match the pattern and sort by code (descending)
    const matchingEnquiries = enquiryList
      .filter(e => e.code && regex.test(e.code))
      .sort((a, b) => {
        const aNum = parseInt(a.code.replace(prefix, ''), 10);
        const bNum = parseInt(b.code.replace(prefix, ''), 10);
        return bNum - aNum;
      });
    
    if (matchingEnquiries.length > 0) {
      const lastCode = matchingEnquiries[0].code;
      const match = lastCode.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }
    
    return `${prefix}${sequenceNumber}`;
  }
  
  function handleAddEntityClick() {
    setSearchText("");
    // Generate code before setting action to add
    const newCode = generateEnquiryCode();
    const newEmptyEnquiry = { ...emptyEnquiry, code: newCode };
    setEmptyEnquiry(newEmptyEnquiry);
    setAction("add");
  }
  
  function handleNavigateToCustomers(autoAdd = false) {
    // If onNavigateToEntity prop is available, use it
    if (props.onNavigateToEntity) {
      props.onNavigateToEntity("Customers", { autoAdd });
    } else {
      // Otherwise, navigate directly using react-router
      navigate("/customers", { 
        state: { 
          filterParams: autoAdd ? { autoAdd: true } : null
        } 
      });
    }
  }
  
  function handleNavigateToEntity(entityName, filterParams = null) {
    // If onNavigateToEntity prop is available, use it
    if (props.onNavigateToEntity) {
      props.onNavigateToEntity(entityName, filterParams);
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
  function handleEditButtonClick(enquiry) {
    setAction("update");
    setEnquiryToBeEdited(enquiry);
  }
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  function handleDeleteButtonClick(ans, enquiry) {
    if (ans == "No") {
      // delete operation cancelled
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      // delete operation allowed
      performDeleteOperation(enquiry);
    }
  }
  async function performDeleteOperation(enquiry) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/enquiries/" + enquiry._id);
      let r = await response.data;
      message = `Enquiry - ${enquiry.code || enquiry._id} deleted successfully.`;
      //update the enquiry list now.
      let prList = enquiryList.filter((e, index) => e._id != enquiry._id);
      setEnquiryList(prList);

      let fprList = enquiryList.filter((e, index) => e._id != enquiry._id);
      setFilteredEnquiryList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      showMessage("Someenquiry went wrong, refresh the page");
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
    let list = [...filteredEnquiryList];
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
    setFilteredEnquiryList(list);
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
    let list = [...filteredEnquiryList];
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
    setFilteredEnquiryList(list);
    setSortedField("updateDate");
  }
  function handleFormTextChangeValidations(message, index) {
    props.onFormTextChangeValidations(message, index);
  }
  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);

    // If clearing search and we have a customer filter active, clear the customer filter too
    if (searchText.trim() === "" && customerIdFilter) {
      // Clear customer filter to show all enquiries
      setCustomerIdFilter(null);
      // The useEffect will trigger getData() when customerIdFilter changes to null
    } else {
      performSearchOperation(searchText);
    }
  }
  
  function handleSearchChange(event) {
    // Handle onChange separately to ensure typing works smoothly
    let searchText = event.target.value;
    setSearchText(searchText);
  }
  function performSearchOperation(searchText) {
    let query = searchText.trim();
    if (query.length == 0) {
      setFilteredEnquiryList(enquiryList);
      return;
    }
    let searchedEnquiries = [];
    searchedEnquiries = filterByShowInListAttributes(query);
    setFilteredEnquiryList(searchedEnquiries);
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
    // Backend already filtered by customerId if filter is active, so search in enquiryList
    for (let i = 0; i < enquiryList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (
            enquiryList[i][parameterName] &&
            enquiryList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(enquiryList[i]);
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
      let result = analyseImportExcelSheet(jsonData, enquiryList);
      if (result.message) {
        showMessage(result.message);
      } else {
        showImportAnalysis(result);
      }
      // analyseSheetData(jsonData, enquiryList);
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
          "enquiries",
          enquiryList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setEnquiryList(result.updatedList);
          setFilteredEnquiryList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "enquiries",
          enquiryList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setEnquiryList(result.updatedList);
          setFilteredEnquiryList(result.updatedList);
        }
        showMessage(result.message);
      } //if
    } catch (error) {
      console.log(error);
      showMessage("Someenquiry went wrong, refresh the page");
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
            <span className="admin-page-navbar-page-name">Enquiries</span>
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
        filteredList={filteredEnquiryList}
        mainList={enquiryList}
        showInList={showInList}
        onListClick={handleListClick}
        onAddEntityClick={handleAddEntityClick}
        onSearchKeyUp={handleSearchKeyUp}
        onSearchChange={handleSearchChange}
        searchText={searchText}
        onExcelFileUploadClick={handleExcelFileUploadClick}
        onClearSelectedFile={handleClearSelectedFile}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {action == "list" && filteredEnquiryList.length == 0 && enquiryList.length != 0 && (
        <div className="empty-state-container">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-3"
              onClick={() => handleNavigateToCustomers(true)}
            >
              <i className="bi bi-plus-lg me-2"></i>Add customer
            </button>
          )}
          <div className="empty-state-icon">
            <i className="bi bi-search"></i>
          </div>
          <h5 className="empty-state-title">No enquiries found</h5>
          <p className="empty-state-message">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
      {action == "list" && enquiryList.length == 0 && (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h5 className="empty-state-title">No enquiries yet</h5>
          <p className="empty-state-message">
            Get started by adding your first enquiry using the + button above.
          </p>
        </div>
      )}
      {action == "list" && filteredEnquiryList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
          onSelectClick={handleSelectClick}
        />
      )}
      {action == "list" && filteredEnquiryList.length != 0 && (
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
          <AdminEnquiryForm
            enquirySchema={enquirySchema}
            enquiryValidations={enquiryValidations}
            emptyEnquiry={emptyEnquiry}
            customerList={customerList}
            enquiryList={enquiryList}
            selectedEntity={selectedEntity}
            enquiryToBeEdited={enquiryToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
            customerIdFilter={customerIdFilter}
          />
        </div>
      )}
      {action == "list" &&
        filteredEnquiryList.length != 0 &&
        filteredEnquiryList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredEnquiryList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
            onCustomerClick={handleCustomerClick}
            customerWhatsappNumber={e.customerWhatsappNumber}
            onWhatsAppClick={handleWhatsAppClick}
            onNavigateToEntity={handleNavigateToEntity}
            enquiryId={e._id}
            enquiryCode={e.code}
            customerName={e.customer ? e.customer.split(' (')[0] : ""}
            customerWhatsappNumberForMenu={e.customerWhatsappNumber}
          />
        ))}
      {showCustomerModal && selectedCustomer && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Customer Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCustomerModalClose}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-person-fill me-2 text-primary" style={{ fontSize: "1.2rem" }}></i>
                    <div>
                      <div className="text-muted small">Name</div>
                      <div className="fw-semibold">{selectedCustomer.name || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-whatsapp me-2 text-success" style={{ fontSize: "1.2rem" }}></i>
                    <div className="flex-grow-1">
                      <div className="text-muted small">WhatsApp Number</div>
                      <div className="fw-semibold">{selectedCustomer.whatsappNumber || "N/A"}</div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start">
                    <i className="bi bi-geo-alt-fill me-2 text-info" style={{ fontSize: "1.2rem", marginTop: "0.2rem" }}></i>
                    <div>
                      <div className="text-muted small">Address</div>
                      <div className="fw-semibold">{selectedCustomer.address || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCustomerModalClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={handleCustomerModalClose} style={{ zIndex: 1040 }}></div>
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
