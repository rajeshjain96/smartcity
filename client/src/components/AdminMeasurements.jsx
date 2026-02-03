import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminMeasurementForm from "./AdminMeasurementForm";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import * as XLSX from "xlsx";
import ModalImport from "./ModalImport";
import { recordsAddBulk } from "../utils/RecordsAddBulk";
import { recordsUpdateBulk } from "../utils/RecordsUpdateBulk";
import { analyseImportExcelSheet } from "../utils/AnalyseImportExcelSheet";
import { getEmptyObject, getShowInList } from "../utils/commonUtil";
import { useEntityAction } from "../contexts/EntityActionContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminMeasurements(props) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get selectedEntity from props if available (from AdminContentPage), otherwise create default
  let selectedEntity = props.selectedEntity || {
    name: "Measurements",
    singularName: "Measurement",
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
  let [measurementList, setMeasurementList] = useState([]);
  let [filteredMeasurementList, setFilteredMeasurementList] = useState([]);
  let [enquiryList, setEnquiryList] = useState([]);
  let [showProductsModal, setShowProductsModal] = useState(false);
  let [selectedMeasurement, setSelectedMeasurement] = useState(null);
  
  const { setAction: setContextAction, setOnListClick } = useEntityAction();
  let [action, setAction] = useState("list");
  let [measurementToBeEdited, setMeasurementToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [flagImport, setFlagImport] = useState(false);
  let [message, setMessage] = useState("");
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
  let [cntShow, setCntShow] = useState(window.maxCnt);
  let formRef = useRef(null);
  let { flagFormInvalid } = props;
  
  let measurementSchema = [
    { attribute: "enquiryId", type: "relationalId" },
    { attribute: "enquiry", type: "normal", relationalData: true, list: "enquirylist", relatedId: "enquiryId" },
    { attribute: "products", type: "array" }, // Array of products
  ];
  
  let measurementValidations = {
    enquiryId: {
      message: "",
      mxLen: 10,
      mnLen: 1,
      onlyDigits: false
    },
    enquiry: {
      message: "",
      mxLen: 50,
      mnLen: 1,
      onlyDigits: false
    },
  };
  
  let initialShowInList = getShowInList(measurementSchema, cntShow);
  // Add products to showInList manually since arrays are excluded by default
  let productsExists = initialShowInList.some(item => item.attribute === "products");
  if (!productsExists) {
    initialShowInList.push({
      attribute: "products",
      show: true, // Show by default to meet minimum 2 fields requirement
      type: "array"
    });
  }
  // Ensure at least 2 fields are shown
  let visibleCount = initialShowInList.filter(item => item.show).length;
  if (visibleCount < 2) {
    // If less than 2 fields are visible, make sure products is visible
    let productsIndex = initialShowInList.findIndex(item => item.attribute === "products");
    if (productsIndex !== -1) {
      initialShowInList[productsIndex].show = true;
    }
  }
  let [showInList, setShowInList] = useState(initialShowInList);
  let [emptyMeasurement, setEmptyMeasurement] = useState(getEmptyObject(measurementSchema));
  let [customerIdFilter, setCustomerIdFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.customerId 
      ? String(selectedEntity.filterParams.customerId) 
      : null
  );
  let [enquiryIdFilter, setEnquiryIdFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.enquiryId 
      ? String(selectedEntity.filterParams.enquiryId) 
      : null
  );
  
  // Track if we've initialized from filterParams to prevent overwriting user input
  const [filterParamsInitialized, setFilterParamsInitialized] = useState(false);
  
  useEffect(() => {
    // Check if filter params are provided in selectedEntity
    // Only initialize once to avoid overwriting user input
    // This matches the exact pattern from AdminEnquiries
    if (!filterParamsInitialized && selectedEntity && selectedEntity.filterParams) {
      if (selectedEntity.filterParams.enquiryId) {
        setEnquiryIdFilter(String(selectedEntity.filterParams.enquiryId));
        setCustomerIdFilter(null);
        
        // Fetch enquiry to get customer name and WhatsApp number for search
        async function fetchEnquiryForSearch() {
          try {
            const response = await axios(`/enquiries/${selectedEntity.filterParams.enquiryId}`);
            const enquiry = await response.data;
            if (enquiry && enquiry.customerId) {
              // Fetch customer to get name and WhatsApp number
              const customerResponse = await axios(`/customers/${enquiry.customerId}`);
              const customer = await customerResponse.data;
              if (customer) {
                const customerName = customer.name || "";
                const whatsappNumber = customer.whatsappNumber || "";
                let searchValue = customerName;
                if (whatsappNumber) {
                  searchValue = `${customerName} (${whatsappNumber})`;
                }
                setSearchText(searchValue);
              }
            }
          } catch (error) {
            console.error("Error fetching enquiry for search:", error);
          }
        }
        fetchEnquiryForSearch();
      } else if (selectedEntity.filterParams.customerId) {
        setCustomerIdFilter(String(selectedEntity.filterParams.customerId));
        setEnquiryIdFilter(null);
        
        // Set search text with customer name and whatsapp number in brackets
        if (selectedEntity.filterParams.customerName || selectedEntity.filterParams.customerWhatsappNumber) {
          const customerName = selectedEntity.filterParams.customerName || "";
          const whatsappNumber = selectedEntity.filterParams.customerWhatsappNumber || "";
          let searchValue = customerName;
          if (whatsappNumber) {
            searchValue = `${customerName} (${whatsappNumber})`;
          }
          setSearchText(searchValue);
        }
      } else {
        setCustomerIdFilter(null);
        setEnquiryIdFilter(null);
        setSearchText("");
      }
      
      setFilterParamsInitialized(true);
    } else if (!filterParamsInitialized && (!selectedEntity || !selectedEntity.filterParams)) {
      setCustomerIdFilter(null);
      setEnquiryIdFilter(null);
      setSearchText("");
      setFilterParamsInitialized(true);
    }
  }, [selectedEntity, filterParamsInitialized]);
  
  useEffect(() => {
    // Only call getData if filters have been initialized (not undefined)
    // This prevents unnecessary calls during initial render
    // Same pattern as AdminEnquiries
    if (customerIdFilter !== undefined && enquiryIdFilter !== undefined) {
      getData();
    }
  }, [customerIdFilter, enquiryIdFilter]);
  
  // Listen for session expiration events from axios interceptor
  useEffect(() => {
    const handleSessionExpired = (event) => {
      // Redirect to home page which will check session and show login if needed
      navigate('/', { replace: true });
    };
    
    window.addEventListener('sessionExpired', handleSessionExpired);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [navigate]);
  
  // Trigger search after data is loaded and searchText is set
  // Only trigger search when searchText exists AND no filters are active (to avoid auto-searching pre-filled text)
  useEffect(() => {
    // Don't auto-search when filters are active - the search text is just for display
    // Only search when user manually types (no filters) or when searchText changes after initial load
    if (searchText && measurementList.length > 0 && !enquiryIdFilter && !customerIdFilter) {
      // Use a small delay to ensure filteredMeasurementList is ready
      const timer = setTimeout(() => {
        performSearchOperation(searchText);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!searchText && measurementList.length > 0) {
      // When search is cleared, restore to measurementList (already filtered by backend if filters active)
      setFilteredMeasurementList(measurementList);
    }
  }, [measurementList, searchText, enquiryIdFilter, customerIdFilter]);
  
  async function getData() {
    setFlagLoad(true);
    try {
      // Build query string with enquiryId or customerId if filter is active
      let url = "/measurements";
      if (enquiryIdFilter) {
        url += `?enquiryId=${enquiryIdFilter}`;
      } else if (customerIdFilter) {
        url += `?customerId=${customerIdFilter}`;
      }
      let response = await axios(url);
      let pList = await response.data;
      
      // Fetch enquiries - if we have enquiryId filter, fetch only that enquiry
      // If we have customerId filter, we can filter enquiries too
      let enquiryListData = [];
      if (enquiryIdFilter) {
        try {
          response = await axios(`/enquiries/${enquiryIdFilter}`);
          const enquiry = await response.data;
          enquiryListData = enquiry ? [enquiry] : [];
        } catch (error) {
          console.error("Error fetching enquiry:", error);
          enquiryListData = [];
        }
      } else {
        let enquiryUrl = "/enquiries";
        if (customerIdFilter) {
          enquiryUrl += `?customerId=${customerIdFilter}`;
        }
        response = await axios(enquiryUrl);
        enquiryListData = await response.data;
      }
      
      // Fetch customers - if we have enquiryId filter, fetch the customer for that enquiry
      // If we have customerId filter, use the customer info from filterParams
      let customerListData = [];
      if (enquiryIdFilter && enquiryListData.length > 0) {
        // Fetch customer for the enquiry
        const enquiry = enquiryListData[0];
        if (enquiry && enquiry.customerId) {
          try {
            response = await axios(`/customers/${enquiry.customerId}`);
            const customer = await response.data;
            customerListData = customer ? [customer] : [];
          } catch (error) {
            console.error("Error fetching customer:", error);
            customerListData = [];
          }
        }
      } else if (!customerIdFilter) {
        response = await axios("/customers");
        customerListData = await response.data;
      } else {
        // When filtering by customer, use the customer info from filterParams
        if (selectedEntity && selectedEntity.filterParams) {
          const customerInfo = {
            _id: selectedEntity.filterParams.customerId,
            name: selectedEntity.filterParams.customerName || "",
            whatsappNumber: selectedEntity.filterParams.customerWhatsappNumber || ""
          };
          customerListData = [customerInfo];
        }
      }
      
      // Format enquiries for display: get customer name and add enquiry code
      enquiryListData.forEach((enquiry) => {
        // Find customer from customerList
        let customerName = "";
        for (let i = 0; i < customerListData.length; i++) {
          if (enquiry.customerId == customerListData[i]._id) {
            customerName = customerListData[i].name || "";
            break;
          }
        }
        const enquiryCode = enquiry.code || "";
        // Format as "Customer Name (Enquiry Code)"
        enquiry.displayName = customerName ? `${customerName} (${enquiryCode})` : `Enquiry (${enquiryCode})`;
      });
      
      // Arrange measurements in sorted order as per updateDate
      pList = pList.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      
      // Update measurements with relational data
      pList.forEach((measurement) => {
        for (let i = 0; i < enquiryListData.length; i++) {
          if (measurement.enquiryId == enquiryListData[i]._id) {
            measurement.enquiry = enquiryListData[i].displayName;
            // Store customerId in measurement for filtering
            measurement.customerId = enquiryListData[i].customerId;
            // Store enquiry addDate for PDF display
            if (enquiryListData[i].addDate) {
              measurement.enquiryAddDate = enquiryListData[i].addDate;
            }
            // Store customer WhatsApp number for searching
            if (customerListData.length > 0) {
              const customer = customerListData.find(c => c._id == enquiryListData[i].customerId);
              if (customer && customer.whatsappNumber) {
                measurement.customerWhatsappNumber = customer.whatsappNumber;
              }
            }
            break;
          }
        }
      });
      
      // Fetch quotation counts for each measurement
      try {
        let quotationsResponse = await axios("/quotations");
        let quotationsList = await quotationsResponse.data;
        
        // Count quotations per measurement
        pList.forEach((measurement) => {
          const quotationCount = quotationsList.filter(
            quotation => String(quotation.measurementId) === String(measurement._id)
          ).length;
          measurement.quotationCount = quotationCount;
        });
      } catch (error) {
        console.error("Error fetching quotations:", error);
        // If quotation fetch fails, set count to 0
        pList.forEach((measurement) => {
          measurement.quotationCount = 0;
        });
      }
      
      // Backend already filtered by customerId if filter is set, so use pList directly
      setEnquiryList(enquiryListData);
      console.log("pList");
      console.log(pList);
      setMeasurementList(pList);
      // In quick mode (filtered by enquiryId or customerId), show all filtered measurements
      // Don't apply search filter - the backend already filtered correctly
      // The search text is just for display purposes in quick mode
      setFilteredMeasurementList(pList);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Session expired - redirect to home which will check session and show login
        navigate('/', { replace: true });
        return;
      }
      showMessage("Oops! An error occurred. Refresh the page");
    }
    setFlagLoad(false);
  }
  
  async function handleFormSubmit(measurement) {
    let message;
    // Remove relational data before sending to backend
    let measurementForBackEnd = { ...measurement };
    for (let key in measurementForBackEnd) {
      measurementSchema.forEach((e, index) => {
        if (key == e.attribute && e.relationalData) {
          delete measurementForBackEnd[key];
        }
      });
    }
    
    if (action == "add") {
      setFlagLoad(true);
      try {
        let response = await axios.post("/measurements", measurementForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        let addedMeasurement = await response.data;
        // Restore relational data
        for (let key in measurement) {
          measurementSchema.forEach((e, index) => {
            if (key == e.attribute && e.relationalData) {
              addedMeasurement[key] = measurement[key];
            }
          });
        }
        message = "Measurement added successfully";
        // Set quotation count to 0 for newly added measurement
        addedMeasurement.quotationCount = 0;
        let prList = [...measurementList];
        prList.push(addedMeasurement);
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setMeasurementList(prList);
        // Since search box is cleared, reset filtered list to show all measurements
        setFilteredMeasurementList(prList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          // Session expired - redirect to home which will check session and show login
          navigate('/', { replace: true });
          return;
        }
        showMessage("Something went wrong, refresh the page");
      }
      setFlagLoad(false);
    } else if (action == "update") {
      measurementForBackEnd._id = measurementToBeEdited._id;
      setFlagLoad(true);
      try {
        let response = await axios.put("/measurements", measurementForBackEnd, {
          headers: { "Content-type": "multipart/form-data" },
        });
        message = "Measurement Updated successfully";
        // Update measurement list with relational data preserved
        let prList = measurementList.map((e, index) => {
          if (e._id == measurement._id) {
            // Preserve relational data and enquiryAddDate in the updated measurement
            let updatedMeasurement = { ...measurement };
            // Preserve enquiryAddDate from original measurement if it exists
            if (e.enquiryAddDate) {
              updatedMeasurement.enquiryAddDate = e.enquiryAddDate;
            }
            return updatedMeasurement;
          }
          return e;
        });
        prList = prList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        let fprList = filteredMeasurementList.map((e, index) => {
          if (e._id == measurement._id) {
            // Preserve enquiryAddDate from original measurement if it exists
            let updatedMeasurement = { ...measurement };
            if (e.enquiryAddDate) {
              updatedMeasurement.enquiryAddDate = e.enquiryAddDate;
            }
            return updatedMeasurement;
          }
          return e;
        });
        fprList = fprList.sort(
          (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
        );
        setMeasurementList(prList);
        setFilteredMeasurementList(fprList);
        showMessage(message);
        setAction("list");
      } catch (error) {
        console.log(error);
        if (error.response && error.response.status === 401) {
          // Session expired - redirect to home which will check session and show login
          navigate('/', { replace: true });
          return;
        }
        showMessage("Something went wrong, refresh the page");
      }
    }
    setFlagLoad(false);
  }
  
  function handleFormCloseClick() {
    setAction("list");
  }
  
  function handleProductsClick(measurement) {
    setSelectedMeasurement(measurement);
    setShowProductsModal(true);
  }
  
  function handleCreateMeasurementListClick(measurement) {
    // Show the products modal for the measurement list
    handleProductsClick(measurement);
  }
  
  function handleProductsModalClose() {
    setShowProductsModal(false);
    setSelectedMeasurement(null);
  }
  
  function handleDownloadPDFClick(e) {
    // CRITICAL: Prevent modal from closing
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
    }
    
    console.log("=== DOWNLOAD PDF BUTTON CLICKED ===");
    console.log("Event:", e);
    console.log("selectedMeasurement:", selectedMeasurement);
    console.log("showProductsModal:", showProductsModal);
    
    // Force modal to stay open
    if (!showProductsModal) {
      console.warn("Modal was closed! Reopening...");
      setShowProductsModal(true);
    }
    
    if (!selectedMeasurement) {
      console.error("No selectedMeasurement");
      showMessage("No measurement data available");
      return;
    }
    
    if (!selectedMeasurement.products || selectedMeasurement.products.length === 0) {
      console.error("No products");
      showMessage("No products to export");
      return;
    }
    
    // Call PDF function - use setTimeout to ensure it runs after any state updates
    setTimeout(() => {
      handleDownloadMeasurementListPDF(e);
      // Ensure modal stays open after PDF generation
      if (!showProductsModal) {
        setShowProductsModal(true);
      }
    }, 0);
  }
  
  function handleDownloadMeasurementListPDF(event) {
    console.log("=== handleDownloadMeasurementListPDF START ===");
    
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Validate jsPDF is available
    if (typeof jsPDF === 'undefined') {
      console.error("jsPDF is not defined!");
      showMessage("PDF library not loaded. Please refresh the page.");
      return;
    }
    
    if (!selectedMeasurement) {
      console.error("No selectedMeasurement");
      showMessage("No measurement data available");
      return;
    }
    
    if (!selectedMeasurement.products || selectedMeasurement.products.length === 0) {
      console.error("No products in selectedMeasurement");
      showMessage("No products to export");
      return;
    }
    
    console.log("All validations passed. Starting PDF generation...");
    console.log("Products count:", selectedMeasurement.products.length);
    
    try {
      console.log("Generating PDF for", selectedMeasurement.products.length, "products");
      
      // Helper function to format field name
      const formatFieldName = (fieldName) => {
        return fieldName
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())
          .trim();
      };
      
      // Helper function to check if a value is present
      const hasValue = (value) => {
        return value !== null && value !== undefined && value !== "";
      };
      
      // Group products by place
      const groupedByPlace = {};
      selectedMeasurement.products.forEach((product) => {
        const place = product.place || "Unspecified";
        if (!groupedByPlace[place]) {
          groupedByPlace[place] = [];
        }
        groupedByPlace[place].push(product);
      });
      
      // Sort places alphabetically
      const sortedPlaces = Object.keys(groupedByPlace).sort();
      
      // Validate we have places to process
      if (sortedPlaces.length === 0) {
        console.error("No places found in products");
        showMessage("No valid product data to export");
        return;
      }
      
      console.log("Processing", sortedPlaces.length, "places");
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "A4",
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let yPos = 50;
      
      // Add header
      doc.setFontSize(20);
      doc.text("Measurement List", margin, yPos);
      yPos += 30;
      
      // Add enquiry information
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Enquiry:", margin, yPos);
      doc.setFont(undefined, "normal");
      doc.text(selectedMeasurement.enquiry +" (Mobile Number:"+ selectedMeasurement.customerWhatsappNumber +")" || "N/A", margin + 60, yPos);
      yPos += 25;
      
      // Add enquiry date if available
      if (selectedMeasurement.enquiryAddDate) {
        const enquiryDate = new Date(selectedMeasurement.enquiryAddDate).toLocaleDateString("en-IN", { 
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        doc.setFont(undefined, "bold");
        doc.text("Enquiry Date:", margin, yPos);
        doc.setFont(undefined, "normal");
        doc.text(enquiryDate, margin + 100, yPos);
        yPos += 25;
      }
      
      // Add measurement date
      if (selectedMeasurement.addDate) {
        const measurementDate = new Date(selectedMeasurement.addDate).toLocaleDateString("en-IN", { 
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "long",
          day: "numeric"
        });
        doc.setFont(undefined, "bold");
        doc.text("Measurement Date:", margin, yPos);
        doc.setFont(undefined, "normal");
        doc.text(measurementDate, margin + 120, yPos);
        yPos += 25;
      }
      
    
      
      yPos += 10;
      
      let placesProcessed = 0;
      
      // Process each place group using for loop to ensure synchronous execution
      for (let placeIndex = 0; placeIndex < sortedPlaces.length; placeIndex++) {
        const place = sortedPlaces[placeIndex];
        const placeProducts = groupedByPlace[place];
        
        // Collect all fields that have values in THIS place group only (matching modal behavior)
        const allFields = new Set();
        placeProducts.forEach((product) => {
          Object.keys(product).forEach((key) => {
            if (key !== "place" && hasValue(product[key])) {
              allFields.add(key);
            }
          });
        });
        
        // Convert to array and sort: productName first, then height, width, curtainType, then others alphabetically
        const fieldOrder = ["productName", "height", "width", "curtainType"];
        const otherFields = Array.from(allFields)
          .filter(f => !fieldOrder.includes(f))
          .sort();
        const sortedFields = [...fieldOrder.filter(f => allFields.has(f)), ...otherFields];
        
        // Skip this place if no fields found
        if (sortedFields.length === 0) {
          console.warn(`No fields found for place: ${place}, skipping`);
          continue;
        }
        
        placesProcessed++;
        
        // Check if we need a new page
        const estimatedHeight = 50 + (placeProducts.length * 25) + 30;
        if (yPos + estimatedHeight > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPos = 50;
        }
        
        // Add place header
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.setTextColor(0, 102, 204);
        doc.text(place, margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;
        
        // Prepare table data
        const tableData = placeProducts.map((product, productIndex) => {
          const row = [(productIndex + 1).toString()];
          sortedFields.forEach((field) => {
            const value = product[field];
            row.push(hasValue(value) ? String(value) : "-");
          });
          return row;
        });
        
        // Prepare table headers
        const tableHeaders = ["#", ...sortedFields.map(f => formatFieldName(f))];
        
        // Add table for this place
        try {
          // Create column styles with minimum widths - columns will be as narrow as possible
          const columnStyles = {};
          const numColumns = tableHeaders.length;
          
          // Serial number column - very narrow
          columnStyles[0] = { cellWidth: 20, cellMinWidth: 15 };
          
          // Other columns - minimum width based on content
          for (let i = 1; i < numColumns; i++) {
            columnStyles[i] = { cellWidth: 'auto', cellMinWidth: 30 };
          }
          
          autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: yPos,
            margin: { left: margin, right: margin },
            theme: "grid",
            tableWidth: 'wrap',
            columnStyles: columnStyles,
            headStyles: { 
              fillColor: [0, 102, 204], 
              textColor: 255,
              fontSize: 14,
              cellPadding: 2,
              lineWidth: 0.5,
              halign: 'center'
            },
            bodyStyles: { 
              fillColor: [245, 245, 245],
              fontSize: 14,
              cellPadding: 2,
              lineWidth: 0.5
            },
            alternateRowStyles: { 
              fillColor: [255, 255, 255],
              fontSize: 14,
              cellPadding: 2
            },
            styles: { 
              fontSize: 14, 
              cellPadding: 2,
              lineWidth: 0.5,
              lineColor: [200, 200, 200],
              overflow: 'linebreak',
              cellWidth: 'auto',
              cellMinWidth: 30
            },
          });
        } catch (tableError) {
          console.error(`Error creating table for place ${place}:`, tableError);
          throw tableError;
        }
        
        // Update yPos after table - check if lastAutoTable exists
        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
          yPos = doc.lastAutoTable.finalY + 20;
        } else {
          // Fallback: estimate based on number of rows
          yPos += (placeProducts.length * 20) + 30;
        }
      }
      
      // Check if we processed any places
      if (placesProcessed === 0) {
        console.error("No places were processed - all places had no valid fields");
        showMessage("No valid product data to export");
        return;
      }
      
      console.log("Processed", placesProcessed, "places successfully");
      
      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth - 100,
          doc.internal.pageSize.getHeight() - 20
        );
      }
      
      // Ensure we have at least one page
      if (pageCount === 0) {
        throw new Error("PDF document has no pages");
      }
      
      // Generate filename
      const dt = new Date();
      const baseFileName = `Measurement_List_${(selectedMeasurement.enquiry || "Record").replace(/[<>:"/\\|?*]/g, "_")}_${dt.toDateString().replace(/\s/g, "_")}_${dt.toLocaleTimeString().replace(/:/g, "-")}.pdf`;
      
      console.log("Saving PDF:", baseFileName, "Pages:", pageCount);
      console.log("PDF document object:", doc);
      console.log("About to call doc.save()");
      
      // Save PDF immediately
      console.log("Calling doc.save() with filename:", baseFileName);
      doc.save(baseFileName);
      console.log("PDF download triggered successfully!");
      showMessage("PDF download started!");
      console.log("=== handleDownloadMeasurementListPDF END (SUCCESS) ===");
      
    } catch (error) {
      console.error("=== ERROR in handleDownloadMeasurementListPDF ===");
      console.error("Error:", error);
      showMessage("Error generating PDF: " + (error.message || "Please try again."));
      console.log("=== handleDownloadMeasurementListPDF END (ERROR) ===");
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

  async function handleCreateQuotationClick(measurement) {
    if (!measurement || !measurement._id) {
      showMessage("Invalid measurement record");
      return;
    }
    
    setFlagLoad(true);
    try {
      let response = await axios.post("/quotations/create-from-measurement", {
        measurementId: measurement._id
      });
      let result = await response.data;
      
      if (result.alreadyExists) {
        showMessage(result.message || "Quotations already exist for this measurement");
      } else {
        showMessage(result.message || `Successfully created ${result.quotations?.length || 0} quotation(s)`);
      }
      
      // Get customer information from the created quotations or existing quotations
      let customerName = "";
      let customerWhatsappNumber = "";
      
      // Try to get customer info from the quotations response
      if (result.quotations && result.quotations.length > 0) {
        customerName = result.quotations[0].customerName || "";
        customerWhatsappNumber = result.quotations[0].whatsappNumber || "";
      }
      
      // If not available from quotations, try to extract from measurement.enquiry
      // Format: "Customer Name (Enquiry Code)"
      if (!customerName && measurement.enquiry) {
        const enquiryParts = measurement.enquiry.split(' (');
        if (enquiryParts.length > 0) {
          customerName = enquiryParts[0].trim();
        }
      }
      
      // If still not available, use customerWhatsappNumber from measurement if stored
      if (!customerWhatsappNumber && measurement.customerWhatsappNumber) {
        customerWhatsappNumber = measurement.customerWhatsappNumber;
      }
      
      // Navigate to Quotations list filtered by customer name
      if (customerName) {
        handleNavigateToEntity("Quotations", { 
          customerName: customerName,
          customerWhatsappNumber: customerWhatsappNumber
        });
      } else {
        // Fallback to measurementId filter if customer name not available
        handleNavigateToEntity("Quotations", { measurementId: measurement._id });
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Session expired - redirect to home which will check session and show login
        navigate('/', { replace: true });
        return;
      } else if (error.response && error.response.data && error.response.data.error) {
        showMessage(error.response.data.error);
      } else {
        showMessage("Something went wrong, refresh the page");
      }
    }
    setFlagLoad(false);
  }
  
  function handleExportMeasurementClick(measurement, exportType) {
    // Helper function to format products array as readable string, grouped by place
    function formatProductsForExport(products) {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return "";
      }
      
      // Group products by place
      const groupedByPlace = {};
      products.forEach((product) => {
        const place = product.place || "Unspecified";
        if (!groupedByPlace[place]) {
          groupedByPlace[place] = [];
        }
        groupedByPlace[place].push(product);
      });
      
      // Sort places alphabetically (or keep original order)
      const sortedPlaces = Object.keys(groupedByPlace).sort();
      
      // Format products placewise
      const formattedSections = sortedPlaces.map((place) => {
        const placeProducts = groupedByPlace[place];
        const placeHeader = `--- ${place} ---`;
        const productLines = placeProducts.map((product) => {
          let parts = [];
          if (product.productName) parts.push(product.productName);
          
          let dimensions = [];
          if (product.height !== undefined && product.height !== "") dimensions.push(`H:${product.height}`);
          if (product.width !== undefined && product.width !== "") dimensions.push(`W:${product.width}`);
          if (product.length !== undefined && product.length !== "") dimensions.push(`L:${product.length}`);
          
          if (dimensions.length > 0) {
            parts.push(`(${dimensions.join(", ")})`);
          }
          
          return parts.join(" ");
        });
        
        return [placeHeader, ...productLines].join("\n");
      });
      
      return formattedSections.join("\n\n");
    }

    // Prepare measurement data for export (without Add Date and Update Date in table)
    let exportData = {
      Enquiry: measurement.enquiry || "",
      Products: formatProductsForExport(measurement.products)
    };

    // Extract dates for header display
    const addDate = measurement.addDate ? new Date(measurement.addDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";
    const updateDate = measurement.updateDate ? new Date(measurement.updateDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "";

    let dt = new Date();
    let baseFileName = `Measurement_${(measurement.enquiry || "Record").replace(/[<>:"/\\|?*]/g, "_")}_${dt.toDateString().replace(/\s/g, "_")}_${dt.toLocaleTimeString().replace(/:/g, "-")}`;

    if (exportType === "excel") {
      // Export to Excel
      import("../utils/ExportToExcel").then((module) => {
        const ExportToExcel = module.default;
        const fileName = baseFileName + ".xlsx";
        ExportToExcel([exportData], fileName);
      }).catch((error) => {
        console.error("Error exporting to Excel:", error);
        alert("Error exporting to Excel. Please try again.");
      });
    } else if (exportType === "pdf") {
      // Export to PDF
      import("../utils/ExportToPDF").then((module) => {
        const ExportToPDF = module.default;
        const fieldsToBeExported = Object.keys(exportData);
        const fileName = baseFileName + ".pdf";
        ExportToPDF("Measurement", fieldsToBeExported, [exportData], fileName, addDate, updateDate);
      }).catch((error) => {
        console.error("Error exporting to PDF:", error);
        alert("Error exporting to PDF. Please try again.");
      });
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
  
  function handleEditButtonClick(measurement) {
    setAction("update");
    setMeasurementToBeEdited(measurement);
  }
  
  function handleSaveClick(measurement) {
    // Trigger form submission if this is the measurement being edited
    if (action === "update" && measurementToBeEdited && measurementToBeEdited._id === measurement._id && formRef.current) {
      formRef.current.submit();
    }
  }
  
  function handleDiscardClick() {
    setAction("list");
    setMeasurementToBeEdited("");
  }
  
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  
  function handleDeleteButtonClick(ans, measurement) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(measurement);
    }
  }
  
  async function performDeleteOperation(measurement) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/measurements/" + measurement._id);
      let r = await response.data;
      message = `Measurement - ${measurement.enquiry || measurement._id} deleted successfully.`;
      let prList = measurementList.filter((e, index) => e._id != measurement._id);
      setMeasurementList(prList);
      let fprList = measurementList.filter((e, index) => e._id != measurement._id);
      setFilteredMeasurementList(fprList);
      showMessage(message);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Session expired - redirect to home which will check session and show login
        navigate('/', { replace: true });
        return;
      }
      showMessage("Something went wrong, refresh the page");
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
    if (cnt == 2 && !checked) {
      showMessage("Minimum 2 fields should be selected.");
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
      if (cnt == 2 && index == selectedIndex && p.show == true) {
        showMessage("Minimum 2 fields should be selected.");
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
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredMeasurementList];
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
    setFilteredMeasurementList(list);
    setSortedField(field);
  }
  
  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredMeasurementList];
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
    setFilteredMeasurementList(list);
    setSortedField("updateDate");
  }
  
  function handleFormTextChangeValidations(message, index) {
    props.onFormTextChangeValidations(message, index);
  }
  
  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);
    // Only perform search if measurementList has data
    // This ensures search works immediately when typing
    // This matches the exact pattern from AdminEnquiries and AdminQuotations
    if (measurementList.length > 0) {
      performSearchOperation(searchText);
    }
  }
  
  function handleSearchChange(event) {
    // Handle onChange separately to ensure typing works smoothly
    let searchText = event.target.value;
    setSearchText(searchText);
  }
  
  function performSearchOperation(searchText) {
    let query = searchText ? searchText.trim() : "";
    console.log(query);
    
    if (query.length == 0) {
      console.log("query");
      console.log(measurementList.length);
      
      // Restore to filtered list (which is already filtered by backend if filter is active)
      // Same pattern as AdminEnquiries and AdminQuotations - measurementList is already filtered by enquiryId/customerId
      // Use a copy to ensure React detects the state change
      setFilteredMeasurementList([...measurementList]);
      return;
    }
    let searchedMeasurements = [];
    searchedMeasurements = filterByShowInListAttributes(query);
    setFilteredMeasurementList(searchedMeasurements);
  }
  
  function filterByShowInListAttributes(query) {
    // Backend already filtered by enquiryId/customerId if filter is active, so search in measurementList
    // Same pattern as AdminEnquiries and AdminQuotations
    let fList = [];
    for (let i = 0; i < measurementList.length; i++) {
      // First check if WhatsApp number matches (for quick mode search)
      if (measurementList[i].customerWhatsappNumber) {
        const whatsappStr = String(measurementList[i].customerWhatsappNumber).toLowerCase();
        if (whatsappStr.includes(query.toLowerCase())) {
          fList.push(measurementList[i]);
          continue;
        }
      }
      // Then check visible fields
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          let fieldValue = measurementList[i][parameterName];
          if (fieldValue != null && fieldValue !== undefined) {
            // Convert to string for comparison (handles numbers, strings, dates, etc.)
            let fieldValueStr = String(fieldValue).toLowerCase();
            if (fieldValueStr.includes(query.toLowerCase())) {
              fList.push(measurementList[i]);
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
      let result = analyseImportExcelSheet(jsonData, measurementList);
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
          "measurements",
          measurementList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setMeasurementList(result.updatedList);
          setFilteredMeasurementList(result.updatedList);
        }
        showMessage(result.message);
      }
      if (recordsToBeUpdated.length > 0) {
        result = await recordsUpdateBulk(
          recordsToBeUpdated,
          "measurements",
          measurementList,
          import.meta.env.VITE_API_URL
        );
        if (result.success) {
          setMeasurementList(result.updatedList);
          setFilteredMeasurementList(result.updatedList);
        }
        showMessage(result.message);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        // Session expired - redirect to home which will check session and show login
        navigate('/', { replace: true });
        return;
      }
      showMessage("Something went wrong, refresh the page");
    }
    setFlagLoad(false);
  }
  
  function handleClearSelectedFile() {
    setSelectedFile(null);
  }
  
  function handleAddEntityClick() {
    setSearchText("");
    setAction("add");
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
            <span className="admin-page-navbar-page-name">Measurements</span>
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
        filteredList={filteredMeasurementList}
        mainList={measurementList}
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
      {action == "list" && filteredMeasurementList.length == 0 && measurementList.length != 0 && (
        <div className="empty-state-container">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-3"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add measurement
            </button>
          )}
          <div className="empty-state-icon">
            <i className="bi bi-search"></i>
          </div>
          <h5 className="empty-state-title">No measurements found</h5>
          <p className="empty-state-message">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}
      {action == "list" && measurementList.length == 0 && (
        <div className="empty-state-container">
          {selectedEntity.addFacility && (
            <button
              className="btn btn-primary mb-3"
              onClick={handleAddEntityClick}
            >
              <i className="bi bi-plus-lg me-2"></i>Add measurement
            </button>
          )}
          <div className="empty-state-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h5 className="empty-state-title">No measurements yet</h5>
          <p className="empty-state-message">
            {enquiryIdFilter || customerIdFilter 
              ? "No measurements found for this filter. Click the button above to add a new measurement."
              : "Get started by adding your first measurement using the + button above."}
          </p>
        </div>
      )}
      {(action == "add" || action == "update") && (
        <div className="row">
          <AdminMeasurementForm
            ref={formRef}
            measurementSchema={measurementSchema}
            measurementValidations={measurementValidations}
            emptyMeasurement={emptyMeasurement}
            enquiryList={enquiryList}
            measurementList={measurementList}
            selectedEntity={selectedEntity}
            measurementToBeEdited={measurementToBeEdited}
            action={action}
            flagFormInvalid={flagFormInvalid}
            onFormSubmit={handleFormSubmit}
            onFormCloseClick={handleFormCloseClick}
            onFormTextChangeValidations={handleFormTextChangeValidations}
            enquiryIdFilter={enquiryIdFilter}
          />
        </div>
      )}
      {action == "list" && filteredMeasurementList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
          onSelectClick={handleSelectClick}
        />
      )}
      {action == "list" && filteredMeasurementList.length != 0 && (
        <div className="row mb-1 mx-auto px-2 py-0 bg-light rounded list-header-row">
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
      {action == "list" &&
        filteredMeasurementList.length != 0 &&
        filteredMeasurementList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredMeasurementList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
            onProductsClick={handleProductsClick}
            onExportClick={handleExportMeasurementClick}
            onCreateQuotationClick={handleCreateQuotationClick}
            onCreateMeasurementListClick={handleCreateMeasurementListClick}
            onNavigateToEntity={handleNavigateToEntity}
          />
        ))}
      {showProductsModal && selectedMeasurement && (
        <div 
          className="modal fade show" 
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} 
          tabIndex="-1" 
          role="dialog"
          onClick={(e) => {
            // Only close if clicking directly on the backdrop (the outer div), not on modal content
            if (e.target === e.currentTarget) {
              handleProductsModalClose();
            }
          }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-lg" 
            role="document" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <div 
              className="modal-content" 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-box-seam me-2"></i>
                  Product Details
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleProductsModalClose}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-clipboard-check me-2 text-primary" style={{ fontSize: "1.2rem" }}></i>
                    <div>
                      <div className="text-muted small">Enquiry</div>
                      <div className="fw-semibold">{selectedMeasurement.enquiry || "N/A"}</div>
                    </div>
                  </div>
                  {selectedMeasurement.customerWhatsappNumber && (
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-whatsapp me-2 text-success" style={{ fontSize: "1.2rem" }}></i>
                      <div>
                        <div className="text-muted small">WhatsApp Number</div>
                        <div className="fw-semibold">{selectedMeasurement.customerWhatsappNumber}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedMeasurement.products && selectedMeasurement.products.length > 0 ? (
                  <div>
                    {(() => {
                      // Helper function to format field name (e.g., "curtainType" -> "Curtain Type")
                      const formatFieldName = (fieldName) => {
                        // Handle camelCase: insert space before capital letters and capitalize first letter
                        return fieldName
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, str => str.toUpperCase())
                          .trim();
                      };
                      
                      // Helper function to check if a value is present (not empty, null, or undefined)
                      const hasValue = (value) => {
                        return value !== null && value !== undefined && value !== "";
                      };
                      
                      // Group products by place
                      const groupedByPlace = {};
                      selectedMeasurement.products.forEach((product) => {
                        const place = product.place || "Unspecified";
                        if (!groupedByPlace[place]) {
                          groupedByPlace[place] = [];
                        }
                        groupedByPlace[place].push(product);
                      });
                      
                      // Sort places alphabetically
                      const sortedPlaces = Object.keys(groupedByPlace).sort();
                      
                      return sortedPlaces.map((place, placeIndex) => {
                        const placeProducts = groupedByPlace[place];
                        
                        // Collect all fields that have at least one value in this place group
                        // Exclude 'place' since it's shown as header
                        const allFields = new Set();
                        placeProducts.forEach((product) => {
                          Object.keys(product).forEach((key) => {
                            if (key !== "place" && hasValue(product[key])) {
                              allFields.add(key);
                            }
                          });
                        });
                        
                        // Convert to array and sort: productName first, then others alphabetically
                        const fieldOrder = ["productName"];
                        const otherFields = Array.from(allFields)
                          .filter(f => f !== "productName")
                          .sort();
                        const sortedFields = [...fieldOrder, ...otherFields];
                        
                        // Calculate column widths dynamically
                        const numFields = sortedFields.length;
                        const serialWidth = "5%";
                        const otherFieldWidth = numFields > 0 ? `${95 / numFields}%` : "auto";
                        
                        return (
                          <div key={placeIndex} className="mb-4">
                            <div className="fw-bold text-primary mb-2" style={{ fontSize: "1.1rem" }}>
                              {place}
                            </div>
                            <div className="table-responsive">
                              <table className="table table-bordered table-hover">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ width: serialWidth }}>#</th>
                                    {sortedFields.map((field) => (
                                      <th key={field} style={{ width: otherFieldWidth }}>
                                        {formatFieldName(field)}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {placeProducts.map((product, productIndex) => (
                                    <tr key={productIndex}>
                                      <td className="text-center">{productIndex + 1}</td>
                                      {sortedFields.map((field) => {
                                        const value = product[field];
                                        // Format numeric fields to right-align
                                        const isNumeric = typeof value === "number" || 
                                          (typeof value === "string" && value !== "" && !isNaN(parseFloat(value)) && isFinite(value));
                                        return (
                                          <td key={field} className={isNumeric ? "text-end" : ""}>
                                            {hasValue(value) ? String(value) : "-"}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
                    <p className="mt-2">No products found</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleDownloadPDFClick}
                  disabled={!selectedMeasurement || !selectedMeasurement.products || selectedMeasurement.products.length === 0}
                >
                  <i className="bi bi-download me-2"></i>Download PDF
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleProductsModalClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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

