import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CommonUtilityBar from "./CommonUtilityBar";
import CheckBoxHeaders from "./CheckBoxHeaders";
import ListHeaders from "./ListHeaders";
import Entity from "./Entity";
import AdminQuotationForm from "./AdminQuotationForm";
import AdminRateForm from "./AdminRateForm";
import LoadingSpinner from "./LoadingSpinner";
import Modal from "./Modal";
import axios from "./AxiosInstance";
import { getShowInList, getEmptyObject } from "../utils/commonUtil";
import ExportQuotationToPDF from "../utils/ExportQuotationToPDF";

export default function AdminQuotations(props) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get selectedEntity from props if available (from AdminContentPage), otherwise create default
  let selectedEntity = props.selectedEntity || {
    name: "Quotations",
    singularName: "Quotation",
    addFacility: false,
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
  let [quotationList, setQuotationList] = useState([]);
  let [filteredQuotationList, setFilteredQuotationList] = useState([]);
  
  let [action, setAction] = useState("list");
  let [quotationToBeEdited, setQuotationToBeEdited] = useState("");
  let [flagLoad, setFlagLoad] = useState(false);
  let [message, setMessage] = useState("");
  let [searchText, setSearchText] = useState("");
  let [filterParamsInitialized, setFilterParamsInitialized] = useState(false); // Track if filter params have been initialized
  let [sortedField, setSortedField] = useState("");
  let [direction, setDirection] = useState("");
  let [cntShow, setCntShow] = useState(window.maxCnt);
  let [showFieldSelectorModal, setShowFieldSelectorModal] = useState(false);
  let formRef = useRef(null);
  let [companyList, setCompanyList] = useState([]);
  let [catalogList, setCatalogList] = useState([]);
  let [ratesData, setRatesData] = useState(null);
  let [shopDetails, setShopDetails] = useState(null);
  let [showDownloadModal, setShowDownloadModal] = useState(false);
  let [quotationToDownload, setQuotationToDownload] = useState(null);
  let [showRatesForm, setShowRatesForm] = useState(false);
  let [customisedRates, setCustomisedRates] = useState(null);
  let [showQuotationModal, setShowQuotationModal] = useState(false);
  let [quotationToShow, setQuotationToShow] = useState(null);
  let [ratesForDisplay, setRatesForDisplay] = useState(null); // Stores the rates being used for display (standard or customised)
  let [isShowMode, setIsShowMode] = useState(false); // Tracks if we're in "show" mode vs "download" mode
  let [currentRatesForPreview, setCurrentRatesForPreview] = useState(null); // Stores current rates for preview in rates form
  let [showViewQuotationModal, setShowViewQuotationModal] = useState(false); // Modal to ask if user wants to see quotation after update
  let [updatedQuotationForView, setUpdatedQuotationForView] = useState(null); // Stores the quotation that was just updated
  
  // Rate schema and validations for customised rates form
  // AP/Roman rates schema
  let apRomanRateSchema = [
    {attribute:"perPlateStitchingRate",type:"normal",label:"Per Plate Stitching Rate (AP)",},
    {attribute:"perSqFtStitchingRate",type:"normal",label:"Per sq.ft.stitching rate(Roman)",},
    {attribute:"astarStitchingRate",type:"normal",label:"Astar Stitching Rate",},
    {attribute:"trackRatePerRunningFeet",type:"normal",label:"Track Rate (per running feet)",},
  ];
  // Blinds rates schema
  let blindsRateSchema = [
    {attribute:"customisedBlindRate",type:"normal",label:"Customised (per sq. ft.)",},
    {attribute:"fabricBlindRate",type:"normal",label:"Fabric Blind (per sq. ft.)",},
    {attribute:"ecoBlackoutBlindRate",type:"normal",label:"Eco-Blackout (per sq. ft.)",},
    {attribute:"verticalBlindRate",type:"normal",label:"Vertical (per sq. ft.)",},
    {attribute:"zebraBlindRate",type:"normal",label:"Zebra (per sq. ft.)",},
  ];
  // Combined schema for empty object generation
  let rateSchema = [...apRomanRateSchema, ...blindsRateSchema];
  let rateValidations = {
    perPlateStitchingRate: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: true
    },
    perSqFtStitchingRate: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: true
    },
    astarStitchingRate: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: true
    },
    trackRatePerRunningFeet: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: true
    },
  };
  let [emptyRate, setEmptyRate] = useState(getEmptyObject(rateSchema));
  let quotationSchema=[
    {attribute:"quotationType",type:"normal",},
    {attribute:"customerName",type:"normal",},
    {attribute:"whatsappNumber",type:"normal",},
    {attribute:"enquiry",type:"normal",},
    {attribute:"products",type:"array",},
  ]
  let [showInList, setShowInList] = useState(getShowInList(quotationSchema,cntShow));
  let [emptyQuotation, setEmptyQuotation] = useState(getEmptyObject(quotationSchema));
  
  // Add products to showInList manually since arrays are excluded by default
  let productsExists = showInList.some(item => item.attribute === "products");
  if (!productsExists) {
    showInList.push({
      attribute: "products",
      show: true,
      type: "array"
    });
  }
  
  let [measurementIdFilter, setMeasurementIdFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.measurementId 
      ? String(selectedEntity.filterParams.measurementId) 
      : null
  );
  let [customerNameFilter, setCustomerNameFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.customerName 
      ? selectedEntity.filterParams.customerName 
      : null
  );
  let [enquiryIdFilter, setEnquiryIdFilter] = useState(
    selectedEntity && selectedEntity.filterParams && selectedEntity.filterParams.enquiryId 
      ? String(selectedEntity.filterParams.enquiryId) 
      : null
  );
  
  useEffect(() => {
    // Check if filter params are provided in selectedEntity
    // Only initialize once to avoid overwriting user input
    // This matches the EXACT pattern from AdminEnquiries - simple, no resetting
    if (!filterParamsInitialized && selectedEntity && selectedEntity.filterParams) {
      if (selectedEntity.filterParams.measurementId) {
        // Convert to string to ensure consistent comparison
        const filterId = String(selectedEntity.filterParams.measurementId);
        setMeasurementIdFilter(filterId);
        setCustomerNameFilter(null);
        setEnquiryIdFilter(null);
        
        // Set search text with enquiry display name from measurement
        if (selectedEntity.filterParams.enquiryDisplayName) {
          setSearchText(selectedEntity.filterParams.enquiryDisplayName);
        } else {
          setSearchText("");
        }
      } else if (selectedEntity.filterParams.enquiryId) {
        setEnquiryIdFilter(String(selectedEntity.filterParams.enquiryId));
        setMeasurementIdFilter(null);
        setCustomerNameFilter(null);
        setSearchText("");
      } else if (selectedEntity.filterParams.customerName) {
        setCustomerNameFilter(selectedEntity.filterParams.customerName);
        setMeasurementIdFilter(null);
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
        } else {
          setSearchText("");
        }
      } else {
        setMeasurementIdFilter(null);
        setCustomerNameFilter(null);
        setEnquiryIdFilter(null);
        setSearchText("");
      }
      
      setFilterParamsInitialized(true);
    } else if (!filterParamsInitialized && (!selectedEntity || !selectedEntity.filterParams)) {
      setMeasurementIdFilter(null);
      setCustomerNameFilter(null);
      setEnquiryIdFilter(null);
      setSearchText("");
      setFilterParamsInitialized(true);
    }
  }, [selectedEntity, filterParamsInitialized]);
  
  useEffect(() => {
    getData();
  }, [measurementIdFilter, customerNameFilter, enquiryIdFilter]);
  
  // Trigger search after data is loaded and searchText is set
  // Only trigger search when searchText exists AND no filters are active (to avoid auto-searching pre-filled text)
  useEffect(() => {
    // Don't auto-search when filters are active - the search text is just for display
    // Only search when user manually types (no filters) or when searchText changes after initial load
    if (searchText && quotationList.length > 0 && !measurementIdFilter && !enquiryIdFilter && !customerNameFilter) {
      // Use a small delay to ensure filteredQuotationList is ready
      const timer = setTimeout(() => {
        performSearchOperation(searchText);
      }, 50);
      return () => clearTimeout(timer);
    } else if (!searchText && quotationList.length > 0) {
      // When search is cleared, restore to quotationList (already filtered by backend if filters active)
      setFilteredQuotationList(quotationList);
    }
  }, [quotationList, searchText, measurementIdFilter, enquiryIdFilter, customerNameFilter]);
  
  async function getData() {
    setFlagLoad(true);
    try {
      // Build query string with measurementId, enquiryId, or customerName if filter is active
      let url = "/quotations";
      if (measurementIdFilter) {
        url += `?measurementId=${measurementIdFilter}`;
      } else if (enquiryIdFilter) {
        url += `?enquiryId=${enquiryIdFilter}`;
      } else if (customerNameFilter) {
        url += `?customerName=${encodeURIComponent(customerNameFilter)}`;
      }
      let response = await axios(url);
      let allQuotations = await response.data; // Store all quotations
      
      // Fetch companies and catalogs for curtain quotation fields
      let companiesResponse = await axios("/companies");
      let companiesData = await companiesResponse.data;
      setCompanyList(companiesData);
      
      let catalogsResponse = await axios("/catalogs");
      let catalogsData = await catalogsResponse.data;
      setCatalogList(catalogsData);
      
      // Fetch rates data for charge calculations
      let ratesResponse = await axios("/rates");
      let ratesList = await ratesResponse.data;
      if (ratesList && ratesList.length > 0) {
        setRatesData(ratesList[0]); // Only one rates record per tenant
      }
      
      // Fetch shop details for PDF header
      let shopDetailsResponse = await axios("/shopDetails");
      let shopDetailsList = await shopDetailsResponse.data;
      if (shopDetailsList && shopDetailsList.length > 0) {
        setShopDetails(shopDetailsList[0]); // Only one shop details record per tenant
      }
      
      // Fetch enquiries to get enquiry codes and customer IDs
      let enquiriesResponse = await axios("/enquiries");
      let enquiriesData = await enquiriesResponse.data;
      
      // Fetch customers to get addresses
      let customersResponse = await axios("/customers");
      let customersData = await customersResponse.data;
      
      // Enrich ALL quotations with enquiry code, customer address, and relational data first
      allQuotations.forEach((quotation) => {
        // Find enquiry by enquiryId and set enquiry code
        if (quotation.enquiryId && enquiriesData.length > 0) {
          const enquiry = enquiriesData.find(e => String(e._id) === String(quotation.enquiryId));
          if (enquiry) {
            if (enquiry.code) {
              quotation.enquiry = enquiry.code;
            }
            // If quotation doesn't have address, get it from customer via enquiry
            if (!quotation.address && enquiry.customerId && customersData.length > 0) {
              const customer = customersData.find(c => String(c._id) === String(enquiry.customerId));
              if (customer && customer.address) {
                quotation.address = customer.address;
              }
            }
          }
        }
        
        // Enrich quotation products with relational data
        if (quotation.products && Array.isArray(quotation.products)) {
          quotation.products = quotation.products.map(product => {
            let enrichedProduct = { ...product };
            // Add company name if companyId exists
            if (enrichedProduct.companyId && companiesData.length > 0) {
              const company = companiesData.find(c => c._id === enrichedProduct.companyId);
              if (company) {
                enrichedProduct.company = company.name || "";
              }
            }
            // Add catalog number/name if catalogId exists
            // Handle both user-entered catalogs (number) and Excel-imported catalogs (name)
            if (enrichedProduct.catalogId && catalogsData.length > 0) {
              const catalog = catalogsData.find(c => c._id === enrichedProduct.catalogId);
              if (catalog) {
                enrichedProduct.catalog = catalog.name || catalog.number || "";
              }
            }
            return enrichedProduct;
          });
        }
      });
      
      // Sort all quotations
      allQuotations = allQuotations.sort(
        (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
      );
      
      // Backend already filters by measurementId, enquiryId, or customerName
      // So allQuotations is already filtered - no need for additional client-side filtering
      // However, we do a safety check for measurementIdFilter to ensure backend filtering worked
      let filteredList = [...allQuotations];
      if (measurementIdFilter) {
        const filterId = String(measurementIdFilter);
        console.log("🔍 Verifying backend filtering by measurementId:", filterId);
        console.log("🔍 Total quotations from backend:", allQuotations.length);
        
        // Double-check that all quotations match the filter (backend should have already filtered)
        const verifiedFiltered = allQuotations.filter(q => {
          if (!q.measurementId) {
            return false;
          }
          const qMeasurementId = String(q.measurementId);
          return qMeasurementId === filterId;
        });
        
        if (verifiedFiltered.length !== allQuotations.length) {
          console.warn("⚠️ Backend filtering may not have worked correctly. Using client-side filter.");
          filteredList = verifiedFiltered;
        } else {
          filteredList = allQuotations; // Backend filtering worked correctly
        }
        console.log("📊 Final filtered list length:", filteredList.length);
      } else {
        // enquiryIdFilter and customerNameFilter are already applied by backend, so allQuotations is already filtered
        filteredList = allQuotations;
        console.log("📊 Showing quotations (filter applied by backend):", allQuotations.length);
      }
      
      // Store all quotations in quotationList (for search/sort)
      // Store filtered quotations in filteredQuotationList (for display)
      setQuotationList(allQuotations);
      setFilteredQuotationList(filteredList);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, refresh the page");
      } else {
        showMessage("Oops! An error occurred. Refresh the page");
      }
    }
    setFlagLoad(false);
  }
  
  function handleListClick() {
    setAction("list");
  }
  
  function handleEditButtonClick(quotation) {
    setAction("update");
    // Enrich quotation products with relational data if not already present
    let enrichedQuotation = { ...quotation };
    if (enrichedQuotation.products && Array.isArray(enrichedQuotation.products)) {
      enrichedQuotation.products = enrichedQuotation.products.map(product => {
        let enrichedProduct = { ...product };
        if (enrichedProduct.companyId && !enrichedProduct.company && companyList.length > 0) {
          const company = companyList.find(c => c._id === enrichedProduct.companyId);
          if (company) {
            enrichedProduct.company = company.name || "";
          }
        }
        if (enrichedProduct.catalogId && !enrichedProduct.catalog && catalogList.length > 0) {
          const catalog = catalogList.find(c => c._id === enrichedProduct.catalogId);
          if (catalog) {
            // Handle both user-entered catalogs (number) and Excel-imported catalogs (name)
            enrichedProduct.catalog = catalog.name || catalog.number || "";
          }
        }
        return enrichedProduct;
      });
    }
    setQuotationToBeEdited(enrichedQuotation);
  }
  
  function handleFormCloseClick() {
    setAction("list");
    setQuotationToBeEdited("");
  }
  
  async function handleFormSubmit(quotation) {
    setFlagLoad(true);
    try {
      // Prepare quotation for backend - remove relational data fields from products
      let quotationForBackEnd = { ...quotation };
      if (quotationForBackEnd.products && Array.isArray(quotationForBackEnd.products)) {
        quotationForBackEnd.products = quotationForBackEnd.products.map(product => {
          // Explicitly preserve catalogId and companyId before removing display fields
          const catalogId = product.catalogId;
          const companyId = product.companyId;
          
          let productForBackEnd = { ...product };
          delete productForBackEnd.company; // Remove company name, keep companyId
          delete productForBackEnd.catalog; // Remove catalog number, keep catalogId
          
          // Explicitly ensure catalogId and companyId are preserved
          // Preserve catalogId even if it's an empty string (to allow clearing)
          if (catalogId !== undefined && catalogId !== null) {
            productForBackEnd.catalogId = catalogId;
          }
          if (companyId !== undefined && companyId !== null) {
            productForBackEnd.companyId = companyId;
          }
          // Ensure calculated fields for AP curtains are preserved
          if (productForBackEnd.curtainType === "AP") {
            // Recalculate to ensure values are up-to-date
            const height = parseFloat(productForBackEnd.height);
            const width = parseFloat(productForBackEnd.width);
            if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
              productForBackEnd.platesRequired = Math.ceil(width / 21);
              productForBackEnd.clothRequired = Math.ceil(((height + 12) / 36) * productForBackEnd.platesRequired);
              productForBackEnd.astarRequired = productForBackEnd.clothRequired;
              productForBackEnd.track = Math.ceil(width / 12);
              
              // Recalculate charges
              const clothRequired = productForBackEnd.clothRequired;
              const astarRequired = productForBackEnd.astarRequired;
              const platesRequired = productForBackEnd.platesRequired;
              const track = productForBackEnd.track;
              
              let clothCharges = 0;
              let astarCharges = 0;
              let stitchingCharges = 0;
              let trackCharges = 0;
              
              // 1. Cloth charges = clothRequired x cloth rate per meter (from catalog)
              if (productForBackEnd.catalogId && catalogList.length > 0) {
                const catalog = catalogList.find(c => c._id === productForBackEnd.catalogId);
                if (catalog && catalog.priceInRs) {
                  const clothRatePerMeter = Math.round(parseFloat(catalog.priceInRs));
                  if (!isNaN(clothRatePerMeter) && clothRatePerMeter > 0) {
                    clothCharges = Math.round(clothRequired * clothRatePerMeter);
                  }
                }
              }
              
              // 2. Astar charges = astarRequired (in meters) x astarStitchingRate (from Rates)
              if (ratesData && ratesData.astarStitchingRate) {
                const astarRate = parseFloat(ratesData.astarStitchingRate);
                if (!isNaN(astarRate) && astarRate > 0) {
                  astarCharges = Math.round(astarRequired * astarRate);
                }
              }
              
              // 3. Stitching charges = platesRequired x perPlateStitchingRate (from Rates)
              if (ratesData && ratesData.perPlateStitchingRate) {
                const perPlateRate = parseFloat(ratesData.perPlateStitchingRate);
                if (!isNaN(perPlateRate) && perPlateRate > 0) {
                  stitchingCharges = Math.round(platesRequired * perPlateRate);
                }
              }
              
              // 4. Track charges = track length (in ft) x trackRatePerRunningFeet (from Rates)
              if (ratesData && ratesData.trackRatePerRunningFeet) {
                const trackRate = parseFloat(ratesData.trackRatePerRunningFeet);
                if (!isNaN(trackRate) && trackRate > 0) {
                  trackCharges = Math.round(track * trackRate);
                }
              }
              
              productForBackEnd.clothCharges = clothCharges;
              productForBackEnd.astarCharges = astarCharges;
              productForBackEnd.stitchingCharges = stitchingCharges;
              productForBackEnd.trackCharges = trackCharges;
            }
          } else if (productForBackEnd.curtainType === "Blinds") {
            const height = parseFloat(productForBackEnd.height);
            const width = parseFloat(productForBackEnd.width);
            
            if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
              // Calculate sq.ft = (height × width) / 144, rounded to nearest integer
              productForBackEnd.stitchingArea = Math.round((width * height) / 144);
              
              // Map blind type to rate field name
              const blindTypeToRateField = {
                "Customised": "customisedBlindRate",
                "Fabric Blind": "fabricBlindRate",
                "Eco-Blackout": "ecoBlackoutBlindRate",
                "Vertical": "verticalBlindRate",
                "Zebra": "zebraBlindRate"
              };
              
              // Calculate curtain cost = sq.ft × selected blind type rate
              const stitchingArea = productForBackEnd.stitchingArea;
              let clothCharges = 0; // For Blinds, this represents "curtain cost"
              
              if (ratesData && productForBackEnd.blindType && stitchingArea > 0) {
                const rateFieldName = blindTypeToRateField[productForBackEnd.blindType];
                if (rateFieldName && ratesData[rateFieldName]) {
                  const blindsRate = Math.round(parseFloat(ratesData[rateFieldName]));
                  if (!isNaN(blindsRate) && blindsRate > 0) {
                    clothCharges = Math.round(stitchingArea * blindsRate);
                  }
                }
              }
              
              productForBackEnd.clothCharges = clothCharges;
              // Clear other charges for Blinds
              productForBackEnd.astarCharges = 0;
              productForBackEnd.stitchingCharges = 0;
              productForBackEnd.trackCharges = 0;
            }
          } else if (productForBackEnd.curtainType === "Roman") {
            // Helper function to round to 0.5 or next integer for Roman curtains
            const roundToHalfOrInteger = (value) => {
              const floor = Math.floor(value);
              const decimal = value - floor;
              if (decimal <= 0.5) {
                return floor + 0.5;
              } else {
                return floor + 1;
              }
            };
            
            // Recalculate to ensure values are up-to-date for Roman curtains
            const height = parseFloat(productForBackEnd.height);
            const width = parseFloat(productForBackEnd.width);
            if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
              // Panna = 48 inches (constant)
              const panna = 48;
              
              // Calculate cloth multiplier = width/(panna-4) = width/44, rounded to integer
              productForBackEnd.clothMultiplier = Math.round(width / (panna - 4));
              
              // Calculate cloth required = ((height+15)/36) x clothMultiplier, rounded to 0.5 or next integer
              productForBackEnd.clothRequired = roundToHalfOrInteger(((height + 15) / 36) * productForBackEnd.clothMultiplier);
              
              // Astar required is same as cloth required
              productForBackEnd.astarRequired = productForBackEnd.clothRequired;
              
              // Track is not used for Roman curtains
              productForBackEnd.track = 0;
              
              // Calculate stitching area in sq.ft = (width x height) / 144, rounded up
              productForBackEnd.stitchingArea = Math.ceil((width * height) / 144);
              
              // Recalculate charges
              const clothRequired = productForBackEnd.clothRequired;
              const astarRequired = productForBackEnd.astarRequired;
              const stitchingArea = productForBackEnd.stitchingArea;
              let clothCharges = 0;
              let astarCharges = 0;
              let stitchingCharges = 0;
              let trackCharges = 0; // Track charges are 0 for Roman
              
              // 1. Cloth charges = clothRequired x cloth rate per meter (from catalog)
              if (productForBackEnd.catalogId && catalogList.length > 0) {
                const catalog = catalogList.find(c => c._id === productForBackEnd.catalogId);
                if (catalog && catalog.priceInRs) {
                  const clothRatePerMeter = Math.round(parseFloat(catalog.priceInRs));
                  if (!isNaN(clothRatePerMeter) && clothRatePerMeter > 0) {
                    clothCharges = Math.round(clothRequired * clothRatePerMeter);
                  }
                }
              }
              
              // 2. Astar charges = astarRequired (in meters) x astarStitchingRate (from Rates)
              if (ratesData && ratesData.astarStitchingRate) {
                const astarRate = parseFloat(ratesData.astarStitchingRate);
                if (!isNaN(astarRate) && astarRate > 0) {
                  astarCharges = Math.round(astarRequired * astarRate);
                }
              }
              
              // 3. Stitching charges = stitchingArea (sq.ft) x perSqFtStitchingRate (from Rates)
              if (ratesData && ratesData.perSqFtStitchingRate) {
                const perSqFtRate = parseFloat(ratesData.perSqFtStitchingRate);
                if (!isNaN(perSqFtRate) && perSqFtRate > 0) {
                  stitchingCharges = Math.round(stitchingArea * perSqFtRate);
                }
              }
              
              // Track charges are not applicable for Roman curtains
              trackCharges = 0;
              
              productForBackEnd.clothCharges = clothCharges;
              productForBackEnd.astarCharges = astarCharges;
              productForBackEnd.stitchingCharges = stitchingCharges;
              productForBackEnd.trackCharges = 0; // No track charges for Roman
            }
          }
          
          // Final safeguard: Ensure catalogId and companyId are preserved
          // This is a backup in case they were lost during processing
          if (catalogId !== undefined && catalogId !== null && !productForBackEnd.catalogId) {
            productForBackEnd.catalogId = catalogId;
          }
          if (companyId !== undefined && companyId !== null && !productForBackEnd.companyId) {
            productForBackEnd.companyId = companyId;
          }
          
          return productForBackEnd;
        });
      }
      
      let response = await axios.put("/quotations", quotationForBackEnd);
      let updatedQuotation = await response.data;
      
      // Enrich products with relational data for display
      if (updatedQuotation.products && Array.isArray(updatedQuotation.products)) {
        updatedQuotation.products = updatedQuotation.products.map(product => {
          let enrichedProduct = { ...product };
          if (enrichedProduct.companyId && companyList.length > 0) {
            const company = companyList.find(c => c._id === enrichedProduct.companyId);
            if (company) {
              enrichedProduct.company = company.name || "";
            }
          }
          if (enrichedProduct.catalogId && catalogList.length > 0) {
            const catalog = catalogList.find(c => c._id === enrichedProduct.catalogId);
            if (catalog) {
              enrichedProduct.catalog = catalog.name || catalog.number || "";
            }
          }
          return enrichedProduct;
        });
      }
      
      let prList = quotationList.map((e) => {
        if (e._id == updatedQuotation._id) {
          return updatedQuotation;
        }
        return e;
      });
      setQuotationList(prList);
      let fprList = filteredQuotationList.map((e) => {
        if (e._id == updatedQuotation._id) {
          return updatedQuotation;
        }
        return e;
      });
      setFilteredQuotationList(fprList);
      showMessage("Quotation updated successfully.");
      
      // Store the updated quotation and show modal to ask if user wants to view it
      setUpdatedQuotationForView(updatedQuotation);
      setShowViewQuotationModal(true);
      
      // Don't close the form yet - wait for user's response
      // setAction("list");
      // setQuotationToBeEdited("");
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
  
  function showMessage(message) {
    setMessage(message);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }
  
  function handleDownloadQuotationClick(quotation) {
    setQuotationToDownload(quotation);
    setShowDownloadModal(true);
    setShowRatesForm(false);
    setCustomisedRates(null);
    setIsShowMode(false); // This is download mode, not show mode
  }
  
  function handleDownloadModalClose() {
    setShowDownloadModal(false);
    setQuotationToDownload(null);
    setShowRatesForm(false);
    setCustomisedRates(null);
    setIsShowMode(false);
  }
  
  function handleShowQuotationClick(quotation) {
    // Open download modal first to let user choose rates
    setQuotationToDownload(quotation);
    setShowDownloadModal(true);
    setShowRatesForm(false);
    setCustomisedRates(null);
    setIsShowMode(true); // Mark that we're in "show" mode
  }
  
  function handleShowQuotationModalClose() {
    setShowQuotationModal(false);
    setQuotationToShow(null);
    setRatesForDisplay(null);
    setIsShowMode(false);
  }
  
  async function handleCreateQuotationFromMeasurement() {
    if (!measurementIdFilter) {
      showMessage("No measurement selected");
      return;
    }
    
    setFlagLoad(true);
    try {
      let response = await axios.post("/quotations/create-from-measurement", {
        measurementId: measurementIdFilter
      });
      let result = await response.data;
      
      if (result.alreadyExists) {
        showMessage(result.message || "Quotations already exist for this measurement");
        // Refresh data to show the existing quotations
        await getData();
      } else {
        showMessage(result.message || `Successfully created ${result.quotations?.length || 0} quotation(s)`);
        // Refresh data to show the newly created quotations
        await getData();
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
  
  function handleViewQuotationModalClose() {
    setShowViewQuotationModal(false);
    setUpdatedQuotationForView(null);
    // Go back to list view
    setAction("list");
    setQuotationToBeEdited("");
  }
  
  function handleViewQuotationModalButtonClick(ans) {
    if (ans === "Yes" && updatedQuotationForView) {
      // User wants to see the quotation - show it
      setShowViewQuotationModal(false);
      handleShowQuotationClick(updatedQuotationForView);
      setUpdatedQuotationForView(null);
      // Go back to list view
      setAction("list");
      setQuotationToBeEdited("");
    } else {
      // User doesn't want to see the quotation - just close modal and go back to list
      handleViewQuotationModalClose();
    }
  }

  // Helper function to render quotation preview (used in rates form modal)
  function renderQuotationPreview(quotation, previewRates) {
    // Helper function to get catalog price
    const getCatalogPrice = (catalogId) => {
      if (!catalogId || !catalogList) return 0;
      const catalog = catalogList.find(c => c._id === catalogId);
      return catalog && catalog.priceInRs ? Math.round(parseFloat(catalog.priceInRs)) : 0;
    };

    // Helper function to format rate - show decimals only when needed
    const formatRate = (rate) => {
      if (!rate || rate === 0) return "0";
      const num = parseFloat(rate);
      // Use a more precise method to avoid floating-point errors
      // Multiply by 100, round, then divide by 100, but check if result is whole number
      const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
      // Check if it's effectively a whole number (within floating-point tolerance)
      const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.001;
      return isWhole ? Math.round(rounded).toString() : rounded.toFixed(2);
    };

    // Get rates - use parseFloat directly (form already handles rounding)
    const ratesToUse = previewRates || {};
    const ratesObj = {
      astarStitchingRate: ratesToUse.astarStitchingRate ? parseFloat(ratesToUse.astarStitchingRate) : 0,
      perPlateStitchingRate: ratesToUse.perPlateStitchingRate ? parseFloat(ratesToUse.perPlateStitchingRate) : 0,
      perSqFtStitchingRate: ratesToUse.perSqFtStitchingRate ? parseFloat(ratesToUse.perSqFtStitchingRate) : 0,
      trackRatePerRunningFeet: ratesToUse.trackRatePerRunningFeet ? parseFloat(ratesToUse.trackRatePerRunningFeet) : 0,
      customisedBlindRate: ratesToUse.customisedBlindRate ? parseFloat(ratesToUse.customisedBlindRate) : 0,
      fabricBlindRate: ratesToUse.fabricBlindRate ? parseFloat(ratesToUse.fabricBlindRate) : 0,
      ecoBlackoutBlindRate: ratesToUse.ecoBlackoutBlindRate ? parseFloat(ratesToUse.ecoBlackoutBlindRate) : 0,
      verticalBlindRate: ratesToUse.verticalBlindRate ? parseFloat(ratesToUse.verticalBlindRate) : 0,
      zebraBlindRate: ratesToUse.zebraBlindRate ? parseFloat(ratesToUse.zebraBlindRate) : 0
    };

    // Filter curtain products (AP, Roman, Blinds)
    const curtainProducts = quotation.products ? quotation.products.filter(p => p.curtainType === "AP" || p.curtainType === "Roman" || p.curtainType === "Blinds") : [];

    // Calculate product details and charges
    const productsWithDetails = curtainProducts.map((product, index) => {
      const height = parseFloat(product.height) || 0;
      const width = parseFloat(product.width) || 0;
      
      let clothRequired = parseFloat(product.clothRequired) || 0;
      let astarRequired = parseFloat(product.astarRequired) || 0;
      let track = parseFloat(product.track) || 0;
      let platesRequired = 0;
      let stitchingArea = 0;
      
      if (product.curtainType === "AP") {
        if (clothRequired === 0 && height > 0 && width > 0) {
          platesRequired = Math.ceil(width / 21);
          clothRequired = Math.ceil(((height + 12) / 36) * platesRequired);
          astarRequired = clothRequired;
          track = Math.ceil(width / 12);
        } else {
          platesRequired = parseFloat(product.platesRequired) || 0;
          if (astarRequired === 0) astarRequired = clothRequired;
          if (track === 0 && width > 0) track = Math.ceil(width / 12);
        }
      } else if (product.curtainType === "Roman") {
        // Helper function to round to 0.5 or next integer for Roman curtains
        const roundToHalfOrInteger = (value) => {
          const floor = Math.floor(value);
          const decimal = value - floor;
          if (decimal <= 0.5) {
            return floor + 0.5;
          } else {
            return floor + 1;
          }
        };
        
        if (clothRequired === 0 && height > 0 && width > 0) {
          const panna = 48;
          const clothMultiplier = Math.round(width / (panna - 4));
          clothRequired = roundToHalfOrInteger(((height + 15) / 36) * clothMultiplier);
          astarRequired = clothRequired;
          track = 0; // Track is not used for Roman curtains
          stitchingArea = Math.ceil((width * height) / 144);
        } else {
          stitchingArea = parseFloat(product.stitchingArea) || 0;
          if (astarRequired === 0) astarRequired = clothRequired;
          track = 0; // Track is not used for Roman curtains
        }
      } else if (product.curtainType === "Blinds") {
        if (height > 0 && width > 0) {
          stitchingArea = Math.round((width * height) / 144);
        } else {
          stitchingArea = parseFloat(product.stitchingArea) || 0;
        }
      }
      
      const clothRatePerMeter = getCatalogPrice(product.catalogId);
      
      let clothCharges = 0;
      let astarCharges = 0;
      let stitchingCharges = 0;
      let trackCharges = 0;
      let blindsCharges = 0;
      
      if (product.curtainType === "Blinds") {
        // Map blind type to rate field name
        const blindTypeToRateField = {
          "Customised": "customisedBlindRate",
          "Fabric Blind": "fabricBlindRate",
          "Eco-Blackout": "ecoBlackoutBlindRate",
          "Vertical": "verticalBlindRate",
          "Zebra": "zebraBlindRate"
        };
        
        if (stitchingArea > 0 && product.blindType) {
          const rateFieldName = blindTypeToRateField[product.blindType];
          if (rateFieldName && ratesObj[rateFieldName] > 0) {
            blindsCharges = Math.round(stitchingArea * ratesObj[rateFieldName]);
          }
        }
      } else {
        if (clothRequired > 0 && clothRatePerMeter > 0) {
          clothCharges = Math.round(clothRequired * clothRatePerMeter);
        }
        if (astarRequired > 0 && ratesObj.astarStitchingRate > 0) {
          astarCharges = Math.round(astarRequired * ratesObj.astarStitchingRate);
        }
        if (product.curtainType === "AP" && platesRequired > 0 && ratesObj.perPlateStitchingRate > 0) {
          stitchingCharges = Math.round(platesRequired * ratesObj.perPlateStitchingRate);
        } else if (product.curtainType === "Roman" && stitchingArea > 0 && ratesObj.perSqFtStitchingRate > 0) {
          stitchingCharges = Math.round(stitchingArea * ratesObj.perSqFtStitchingRate);
        }
        // Track charges only for AP type, not for Roman
        if (product.curtainType === "AP" && track > 0 && ratesObj.trackRatePerRunningFeet > 0) {
          trackCharges = Math.round(track * ratesObj.trackRatePerRunningFeet);
        }
      }
      
      const productTotal = product.curtainType === "Blinds" 
        ? blindsCharges 
        : product.curtainType === "Roman"
        ? clothCharges + astarCharges + stitchingCharges // No track charges for Roman
        : clothCharges + astarCharges + stitchingCharges + trackCharges;
      
      return {
        ...product,
        clothRequired,
        astarRequired,
        track,
        platesRequired,
        stitchingArea,
        clothRatePerMeter,
        clothCharges,
        astarCharges,
        stitchingCharges,
        trackCharges,
        blindsCharges,
        productTotal
      };
    });

    const grandTotal = productsWithDetails.reduce((sum, p) => sum + p.productTotal, 0);

    // Get today's date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });

    return (
      <div className="quotation-preview">
        <h6 className="mb-3 fw-bold">Quotation Preview</h6>
        
        {/* Shop Details Header */}
        {shopDetails && (
          <div className="mb-3 pb-2" style={{ 
            borderBottom: '3px double #000',
            paddingBottom: '0.5rem'
          }}>
            <div className="row align-items-start">
              {shopDetails.logo && (
                <div className="col-auto">
                  <img 
                    src={`${import.meta.env.VITE_API_URL}/api/uploadedImages/${shopDetails.logo}`} 
                    alt="Shop Logo" 
                    style={{ maxWidth: "40px", maxHeight: "40px" }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="col">
                {shopDetails.shopName && (
                  <div className="fw-bold small mb-1">{shopDetails.shopName}</div>
                )}
                {shopDetails.address && (
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>{shopDetails.address}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="text-end mb-2">
          <span className="text-muted" style={{ fontSize: "0.75rem" }}>Date: {dateStr}</span>
        </div>

        {/* Heading */}
        <div className="text-center mb-3">
          <h6 className="fw-bold">
            Quotation ({quotation.quotationType === "curtain" ? "curtains" : quotation.quotationType === "accessories" ? "accessories" : quotation.quotationType || "items"})
          </h6>
        </div>

        {/* Customer Details */}
        {(quotation.customerName || quotation.address || quotation.whatsappNumber) && (
          <div className="mb-3">
            <div className="text-muted" style={{ fontSize: "0.8rem" }}>
              {[quotation.customerName, quotation.address, quotation.whatsappNumber].filter(Boolean).join(" | ")}
            </div>
          </div>
        )}

        {/* Products */}
        {productsWithDetails.length > 0 ? (
          <div>
            {(() => {
              // Group products by place
              const groupedByPlace = {};
              productsWithDetails.forEach((product, originalIndex) => {
                const place = product.place || "Unspecified";
                if (!groupedByPlace[place]) {
                  groupedByPlace[place] = [];
                }
                groupedByPlace[place].push({ ...product, originalIndex });
              });
              
              // Sort places alphabetically
              const sortedPlaces = Object.keys(groupedByPlace).sort();
              
              return sortedPlaces.map((place, placeIndex) => {
                const placeProducts = groupedByPlace[place];
                const placeTotal = placeProducts.reduce((sum, p) => sum + p.productTotal, 0);
                
                return (
                  <div key={placeIndex} className="mb-3">
                    {/* Place Header */}
                    <div className="fw-bold mb-2 pb-1 border-bottom" style={{ fontSize: "0.9rem" }}>
                      {placeIndex + 1}. {place} ({placeProducts.length})
                    </div>
                    
                    {/* Products for this place */}
                    {placeProducts.map((product, productIndex) => {
                      let catalogNumber = product.catalog;
                      if (!catalogNumber && product.catalogId && catalogList) {
                        const catalog = catalogList.find(c => c._id === product.catalogId);
                        if (catalog && catalog.number) {
                          catalogNumber = catalog.number;
                        }
                      }

                      return (
                        <div key={productIndex} className="mb-3 border-bottom pb-3">
                          {/* Product Header */}
                          <div className="fw-semibold mb-1 text-muted" style={{ fontSize: "0.85rem" }}>
                            {productIndex + 1}.
                          </div>

                          {/* Dimensions */}
                          {(product.height || product.width) && (
                            <div className="mb-1" style={{ fontSize: "0.8rem" }}>
                              <span className="text-muted">Dimensions: </span>
                              {[product.height, product.width].filter(Boolean).join(" x ")}
                            </div>
                          )}

                          {/* Type */}
                          <div className="mb-1" style={{ fontSize: "0.8rem" }}>
                            <span className="text-muted">Type: </span>
                            {product.curtainType || "N/A"}
                          </div>

                          {/* Catalog No. */}
                          {product.curtainType !== "Blinds" && catalogNumber && (
                            <div className="mb-2" style={{ fontSize: "0.8rem" }}>
                              <span className="text-muted">Catalog No.: </span>
                              {catalogNumber}
                            </div>
                          )}

                          {/* Dashed line */}
                          <hr className="border-dashed my-2" style={{ borderStyle: "dashed", borderWidth: "1px" }} />

                          {/* Line Items */}
                          <div className="mt-2">
                            <div className="row mb-1" style={{ fontSize: "0.75rem" }}>
                              <div className="col-4">
                                {product.curtainType === "Blinds" ? (
                                  <span>{product.stitchingArea} sq.ft</span>
                                ) : (
                                  <span>{product.clothRequired} meter</span>
                                )}
                              </div>
                              <div className="col-4">
                                {product.curtainType === "Blinds" ? "curtain cost" : "Cloth"}
                              </div>
                              <div className="col-4 text-end fw-semibold">
                                Rs. {product.curtainType === "Blinds" ? product.blindsCharges : product.clothCharges}/-
                              </div>
                            </div>

                            {/* Astar - for AP and Roman */}
                            {product.astarRequired > 0 && product.curtainType !== "Blinds" && product.astarCharges > 0 && (
                              <div className="row mb-1" style={{ fontSize: "0.75rem" }}>
                                <div className="col-4">{product.astarRequired} meter</div>
                                <div className="col-4">Astar</div>
                                <div className="col-4 text-end fw-semibold">
                                  Rs. {product.astarCharges}/-
                                </div>
                              </div>
                            )}

                            {/* Stitching */}
                            {product.curtainType === "AP" && product.platesRequired > 0 && product.stitchingCharges > 0 && (
                              <div className="row mb-1" style={{ fontSize: "0.75rem" }}>
                                <div className="col-4">{product.platesRequired} plates</div>
                                <div className="col-4">stitching</div>
                                <div className="col-4 text-end fw-semibold">
                                  Rs. {product.stitchingCharges}/-
                                </div>
                              </div>
                            )}
                            {product.curtainType === "Roman" && product.stitchingArea > 0 && product.stitchingCharges > 0 && (
                              <div className="row mb-1" style={{ fontSize: "0.75rem" }}>
                                <div className="col-4">{product.stitchingArea} sq.ft</div>
                                <div className="col-4">stitching</div>
                                <div className="col-4 text-end fw-semibold">
                                  Rs. {product.stitchingCharges}/-
                                </div>
                              </div>
                            )}

                            {/* Track - only for AP type, not for Roman */}
                            {product.track > 0 && product.curtainType === "AP" && product.trackCharges > 0 && (
                              <div className="row mb-1" style={{ fontSize: "0.75rem" }}>
                                <div className="col-4">{product.track} feet</div>
                                <div className="col-4">track</div>
                                <div className="col-4 text-end fw-semibold">
                                  Rs. {product.trackCharges}/-
                                </div>
                              </div>
                            )}

                            {/* Product Total */}
                            <div className="row mt-2 pt-1 border-top">
                              <div className="col-8 fw-bold" style={{ fontSize: "0.8rem" }}>Total</div>
                              <div className="col-4 text-end fw-bold" style={{ fontSize: "0.8rem" }}>
                                Rs. {product.productTotal}/-
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Place Subtotal */}
                    {placeProducts.length > 1 && (
                      <div className="row mt-2 pt-1 border-top">
                        <div className="col-8 fw-semibold" style={{ fontSize: "0.85rem" }}>Subtotal for {place}</div>
                        <div className="col-4 text-end fw-semibold" style={{ fontSize: "0.85rem" }}>
                          Rs. {placeTotal}/-
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}

            {/* Grand Total */}
            <div className="row mt-3 pt-2 border-top">
              <div className="col-8 fw-bold" style={{ fontSize: "0.9rem" }}>Grand Total</div>
              <div className="col-4 text-end fw-bold" style={{ fontSize: "0.9rem" }}>
                Rs. {grandTotal}/-
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-info" style={{ fontSize: "0.8rem" }}>
            <i className="bi bi-info-circle me-2"></i>
            {quotation.products && quotation.products.length > 0 
              ? "Select the curtain type first." 
              : "No curtain products found in this quotation."}
          </div>
        )}
      </div>
    );
  }
  
  function handleShowRatesForm() {
    // Initialize customised rates with current rates data
    if (ratesData) {
      setCustomisedRates({ ...ratesData });
    } else {
      setCustomisedRates({ ...emptyRate });
    }
    setShowRatesForm(true);
  }
  
  function handleRatesFormSubmit(customRates) {
    // Store the customised rates
    setCustomisedRates(customRates);
    if (isShowMode) {
      // If in show mode, show the quotation with customised rates
      setRatesForDisplay(customRates);
      setQuotationToShow(quotationToDownload);
      setShowQuotationModal(true);
      setShowDownloadModal(false);
      setShowRatesForm(false);
    } else {
      // If in download mode, generate PDF with customised rates
      handleDownloadWithCustomRates(customRates);
    }
  }
  
  function handleRatesFormCancel() {
    // Go back to options view
    setShowRatesForm(false);
    setCustomisedRates(null);
  }
  
  async function handleDownloadWithCustomRates(customRates) {
    if (quotationToDownload && customRates) {
      // Generate PDF for customer with customised rates
      // Ensure we're using the customRates passed from the form, not ratesData
      console.log("📊 Using customised rates for PDF:", customRates);
      await ExportQuotationToPDF(quotationToDownload, catalogList, customRates, shopDetails, true, import.meta.env.VITE_API_URL);
      handleDownloadModalClose();
    }
  }
  
  async function handleDownloadOptionClick(option) {
    if (option === "customer" && quotationToDownload) {
      if (isShowMode) {
        // If in show mode, show the quotation with standard rates
        setRatesForDisplay(ratesData);
        setQuotationToShow(quotationToDownload);
        setShowQuotationModal(true);
        setShowDownloadModal(false);
      } else {
        // If in download mode, generate PDF with standard rates
        await ExportQuotationToPDF(quotationToDownload, catalogList, ratesData, shopDetails, false, import.meta.env.VITE_API_URL);
        handleDownloadModalClose();
      }
    } else if (option === "customerCustomised" && quotationToDownload) {
      // Show rates form instead of immediately downloading/showing
      handleShowRatesForm();
    } else if (option === "internal" && quotationToDownload) {
      // TODO: Implement download for internal use (different format)
      console.log("Internal quotation download not yet implemented", quotationToDownload);
      handleDownloadModalClose();
    }
  }
  
  function handleDeleteButtonClick(ans, quotation) {
    if (ans == "No") {
      showMessage("Delete operation cancelled");
      return;
    }
    if (ans == "Yes") {
      performDeleteOperation(quotation);
    }
  }
  
  async function performDeleteOperation(quotation) {
    setFlagLoad(true);
    try {
      let response = await axios.delete("/quotations/" + quotation._id);
      let r = await response.data;
      message = `Quotation - ${quotation.quotationType} deleted successfully.`;
      let prList = quotationList.filter((e, index) => e._id != quotation._id);
      setQuotationList(prList);
      let fprList = filteredQuotationList.filter((e, index) => e._id != quotation._id);
      setFilteredQuotationList(fprList);
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
    let list = [...filteredQuotationList];
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
    setFilteredQuotationList(list);
    setSortedField(field);
  }
  
  function handleSrNoClick() {
    let d = false;
    if (sortedField === "updateDate") {
      d = !direction;
    } else {
      d = false;
    }
    let list = [...filteredQuotationList];
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
    setFilteredQuotationList(list);
    setSortedField("updateDate");
  }
  
  function handleSearchChange(event) {
    // Handle onChange separately to ensure typing works smoothly
    let searchText = event.target.value;
    setSearchText(searchText);
  }
  
  function handleSearchKeyUp(event) {
    let searchText = event.target.value;
    setSearchText(searchText);
    // Only perform search if quotationList has data
    // This ensures search works immediately when typing
    // This matches the exact pattern from AdminEnquiries and AdminMeasurements
    if (quotationList.length > 0) {
      performSearchOperation(searchText);
    }
  }
  
  function performSearchOperation(searchText) {
    let query = searchText ? searchText.trim() : "";
    if (query.length == 0) {
      // Restore to filtered list (which is already filtered by backend if filter is active)
      // Same pattern as AdminEnquiries and AdminMeasurements - quotationList is already filtered by measurementId/enquiryId/customerName
      // Use a copy to ensure React detects the state change
      setFilteredQuotationList([...quotationList]);
      return;
    }
    let searchedQuotations = [];
    searchedQuotations = filterByShowInListAttributes(query);
    setFilteredQuotationList(searchedQuotations);
  }
  
  function filterByShowInListAttributes(query) {
    // Backend already filtered by measurementId/enquiryId/customerName if filter is active, so search in quotationList
    // Same pattern as AdminEnquiries
    let fList = [];
    for (let i = 0; i < quotationList.length; i++) {
      for (let j = 0; j < showInList.length; j++) {
        if (showInList[j].show) {
          let parameterName = showInList[j].attribute;
          if (parameterName === "products") {
            // Search in products array
            const productsStr = quotationList[i][parameterName] 
              ? JSON.stringify(quotationList[i][parameterName]).toLowerCase()
              : "";
            if (productsStr.includes(query.toLowerCase())) {
              fList.push(quotationList[i]);
              break;
            }
          } else if (
            quotationList[i][parameterName] &&
            quotationList[i][parameterName]
              .toLowerCase()
              .includes(query.toLowerCase())
          ) {
            fList.push(quotationList[i]);
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
            <span className="admin-page-navbar-page-name">Quotations</span>
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
        filteredList={filteredQuotationList}
        mainList={quotationList}
        showInList={showInList}
        onListClick={handleListClick}
        onSearchKeyUp={handleSearchKeyUp}
        onSearchChange={handleSearchChange}
        searchText={searchText}
        onFieldSelectorClick={() => setShowFieldSelectorModal(true)}
      />
      {/* Create Quotation button - shown when no quotations exist for a measurement */}
      {action == "list" && quotationList.length == 0 && measurementIdFilter && (
        <div className="text-center my-3">
          <button
            className="btn btn-primary"
            onClick={handleCreateQuotationFromMeasurement}
            disabled={flagLoad}
          >
            <i className="bi bi-plus-lg me-2"></i>Create Quotation
          </button>
        </div>
      )}
      {filteredQuotationList.length == 0 && quotationList.length != 0 && (
        <div className="text-center">No quotation to show</div>
      )}
      {action == "list" && quotationList.length == 0 && measurementIdFilter && (
        <div className="empty-state-container">
          <div className="empty-state-icon">
            <i className="bi bi-file-text"></i>
          </div>
          <h5 className="empty-state-title">No quotations yet</h5>
          <p className="empty-state-message">
            No quotations have been created for this measurement yet.
          </p>
        </div>
      )}
      {quotationList.length == 0 && !measurementIdFilter && (
        <div className="text-center">List is empty</div>
      )}
      {action == "list" && filteredQuotationList.length != 0 && (
        <CheckBoxHeaders
          showInList={showInList}
          cntShow={cntShow}
          showModal={showFieldSelectorModal}
          onModalClose={() => setShowFieldSelectorModal(false)}
          onListCheckBoxClick={handleListCheckBoxClick}
        />
      )}
      {action == "list" && filteredQuotationList.length != 0 && (
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
      {action == "list" &&
        filteredQuotationList.length != 0 &&
        filteredQuotationList.map((e, index) => (
          <Entity
            entity={e}
            key={index + 1}
            index={index}
            sortedField={sortedField}
            direction={direction}
            listSize={filteredQuotationList.length}
            selectedEntity={selectedEntity}
            showInList={showInList}
            cntShow={cntShow}
            VITE_API_URL={import.meta.env.VITE_API_URL}
            onEditButtonClick={handleEditButtonClick}
            onDeleteButtonClick={handleDeleteButtonClick}
            onToggleText={handleToggleText}
            onDownloadQuotationClick={handleDownloadQuotationClick}
            onShowQuotationClick={handleShowQuotationClick}
          />
        ))}
      {action == "update" && (
        <AdminQuotationForm
          ref={formRef}
          action={action}
          selectedEntity={selectedEntity}
          emptyQuotation={emptyQuotation}
          quotationToBeEdited={quotationToBeEdited}
          companyList={companyList}
          catalogList={catalogList}
          ratesData={ratesData}
          onFormSubmit={handleFormSubmit}
          onFormCloseClick={handleFormCloseClick}
        />
      )}
      
      {/* Download Quotation Modal */}
      {showDownloadModal && quotationToDownload && (
        <>
          <div className="modal-wrapper" onClick={handleDownloadModalClose} style={{ zIndex: 1040 }}></div>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: showRatesForm && isShowMode ? "95%" : showRatesForm ? "40rem" : "30rem", width: "95%", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="text-bigger d-flex justify-content-between bg-primary text-white mb-3 p-2">
              <div>{showRatesForm ? "Customise Rates" : (isShowMode ? "View Quotation" : "Download Quotation")}</div>
              <div onClick={handleDownloadModalClose} style={{ cursor: "pointer" }}>
                <i className="bi bi-x-square"></i>
              </div>
            </div>
            {!showRatesForm ? (
              <>
                <div className="my-3 p-3">
                  <div className="text-center">
                    <p className="mb-4">{isShowMode ? "Select the type of quotation you want to view:" : "Select the type of quotation you want to download:"}</p>
                    <div className="d-flex flex-column gap-3 align-items-center">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-lg w-75"
                        onClick={() => {
                          handleDownloadOptionClick("customer");
                        }}
                      >
                        <i className="bi bi-person-check me-2"></i>
                        <div>
                          Quotation
                          <br />
                          <span style={{ fontSize: "0.85em" }}>(using standard rates)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-lg w-75"
                        onClick={() => {
                          handleDownloadOptionClick("customerCustomised");
                        }}
                      >
                        <i className="bi bi-person-check me-2"></i>
                        <div>
                          Quotation
                          <br />
                          <span style={{ fontSize: "0.85em" }}>(using customised rates)</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg w-75"
                        onClick={() => {
                          handleDownloadOptionClick("internal");
                        }}
                      >
                        <i className="bi bi-building me-2"></i>
                        Quotation for Internal Use
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-center mb-3">
                  <button className="btn btn-primary mx-1" onClick={handleDownloadModalClose}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="p-3">
                {isShowMode ? (
                  <div className="row g-3">
                    {/* Rates Form - Left Side */}
                    <div className="col-12 col-md-6" style={{ maxHeight: "calc(90vh - 150px)", overflowY: "auto" }}>
                    <AdminRateForm
                      apRomanRateSchema={apRomanRateSchema}
                      blindsRateSchema={blindsRateSchema}
                      rateValidations={rateValidations}
                      emptyRate={emptyRate}
                      selectedEntity={selectedEntity}
                      rateToBeEdited={customisedRates || ratesData || emptyRate}
                      action="update"
                      flagFormInvalid={false}
                      onFormSubmit={handleRatesFormSubmit}
                      onFormCloseClick={handleRatesFormCancel}
                      loggedInUser={props.user || null}
                      submitButtonLabel="View Quotation"
                      onRateChange={setCurrentRatesForPreview}
                    />
                    </div>
                    {/* Quotation Preview - Right Side */}
                    <div className="col-12 col-md-6" style={{ maxHeight: "calc(90vh - 150px)", overflowY: "auto" }}>
                      {quotationToDownload && (() => {
                        // Use current rates from form if available, otherwise use customisedRates or ratesData
                        const previewRates = currentRatesForPreview || customisedRates || ratesData || {};
                        return renderQuotationPreview(quotationToDownload, previewRates);
                      })()}
                    </div>
                  </div>
                ) : (
                  <div style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto" }}>
                    <AdminRateForm
                      apRomanRateSchema={apRomanRateSchema}
                      blindsRateSchema={blindsRateSchema}
                      rateValidations={rateValidations}
                      emptyRate={emptyRate}
                      selectedEntity={selectedEntity}
                      rateToBeEdited={customisedRates || ratesData || emptyRate}
                      action="update"
                      flagFormInvalid={false}
                      onFormSubmit={handleRatesFormSubmit}
                      onFormCloseClick={handleRatesFormCancel}
                      loggedInUser={props.user || null}
                      submitButtonLabel="Download Quotation"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {/* Show Quotation Modal */}
      {showQuotationModal && quotationToShow && (() => {
        // Helper function to get catalog price
        const getCatalogPrice = (catalogId) => {
          if (!catalogId || !catalogList) return 0;
          const catalog = catalogList.find(c => c._id === catalogId);
          return catalog && catalog.priceInRs ? Math.round(parseFloat(catalog.priceInRs)) : 0;
        };

        // Helper function to format rate - show decimals only when needed
        const formatRate = (rate) => {
          if (!rate || rate === 0) return "0";
          const num = parseFloat(rate);
          // Use a more precise method to avoid floating-point errors
          // Multiply by 100, round, then divide by 100, but check if result is whole number
          const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
          // Check if it's effectively a whole number (within floating-point tolerance)
          const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.001;
          return isWhole ? Math.round(rounded).toString() : rounded.toFixed(2);
        };

        // Get rates - use ratesForDisplay if available (for customised rates), otherwise use ratesData (standard rates)
        const ratesToUse = ratesForDisplay || ratesData || {};
        const ratesObj = {
          astarStitchingRate: ratesToUse.astarStitchingRate ? parseFloat(ratesToUse.astarStitchingRate) : 0,
          perPlateStitchingRate: ratesToUse.perPlateStitchingRate ? parseFloat(ratesToUse.perPlateStitchingRate) : 0,
          perSqFtStitchingRate: ratesToUse.perSqFtStitchingRate ? parseFloat(ratesToUse.perSqFtStitchingRate) : 0,
          trackRatePerRunningFeet: ratesToUse.trackRatePerRunningFeet ? parseFloat(ratesToUse.trackRatePerRunningFeet) : 0,
          customisedBlindRate: ratesToUse.customisedBlindRate ? parseFloat(ratesToUse.customisedBlindRate) : 0,
          fabricBlindRate: ratesToUse.fabricBlindRate ? parseFloat(ratesToUse.fabricBlindRate) : 0,
          ecoBlackoutBlindRate: ratesToUse.ecoBlackoutBlindRate ? parseFloat(ratesToUse.ecoBlackoutBlindRate) : 0,
          verticalBlindRate: ratesToUse.verticalBlindRate ? parseFloat(ratesToUse.verticalBlindRate) : 0,
          zebraBlindRate: ratesToUse.zebraBlindRate ? parseFloat(ratesToUse.zebraBlindRate) : 0
        };

        // Filter curtain products (AP, Roman, Blinds)
        const curtainProducts = quotationToShow.products ? quotationToShow.products.filter(p => p.curtainType === "AP" || p.curtainType === "Roman" || p.curtainType === "Blinds") : [];

        // Calculate product details and charges
        const productsWithDetails = curtainProducts.map((product, index) => {
          const height = parseFloat(product.height) || 0;
          const width = parseFloat(product.width) || 0;
          
          let clothRequired = parseFloat(product.clothRequired) || 0;
          let astarRequired = parseFloat(product.astarRequired) || 0;
          let track = parseFloat(product.track) || 0;
          let platesRequired = 0;
          let stitchingArea = 0;
          
          if (product.curtainType === "AP") {
            if (clothRequired === 0 && height > 0 && width > 0) {
              platesRequired = Math.ceil(width / 21);
              clothRequired = Math.ceil(((height + 12) / 36) * platesRequired);
              astarRequired = clothRequired;
              track = Math.ceil(width / 12);
            } else {
              platesRequired = parseFloat(product.platesRequired) || 0;
              if (astarRequired === 0) astarRequired = clothRequired;
              if (track === 0 && width > 0) track = Math.ceil(width / 12);
            }
            } else if (product.curtainType === "Roman") {
              // Helper function to round to 0.5 or next integer for Roman curtains
              const roundToHalfOrInteger = (value) => {
                const floor = Math.floor(value);
                const decimal = value - floor;
                if (decimal <= 0.5) {
                  return floor + 0.5;
                } else {
                  return floor + 1;
                }
              };
              
              if (clothRequired === 0 && height > 0 && width > 0) {
                const panna = 48;
                const clothMultiplier = Math.round(width / (panna - 4));
                clothRequired = roundToHalfOrInteger(((height + 15) / 36) * clothMultiplier);
                astarRequired = clothRequired;
                track = 0; // Track is not used for Roman curtains
                stitchingArea = Math.ceil((width * height) / 144);
              } else {
                stitchingArea = parseFloat(product.stitchingArea) || 0;
                if (astarRequired === 0) astarRequired = clothRequired;
                track = 0; // Track is not used for Roman curtains
              }
          } else if (product.curtainType === "Blinds") {
            if (height > 0 && width > 0) {
              stitchingArea = Math.round((width * height) / 144);
            } else {
              stitchingArea = parseFloat(product.stitchingArea) || 0;
            }
          }
          
          const clothRatePerMeter = getCatalogPrice(product.catalogId);
          
          let clothCharges = 0;
          let astarCharges = 0;
          let stitchingCharges = 0;
          let trackCharges = 0;
          let blindsCharges = 0;
          
          if (product.curtainType === "Blinds") {
            // Map blind type to rate field name
            const blindTypeToRateField = {
              "Customised": "customisedBlindRate",
              "Fabric Blind": "fabricBlindRate",
              "Eco-Blackout": "ecoBlackoutBlindRate",
              "Vertical": "verticalBlindRate",
              "Zebra": "zebraBlindRate"
            };
            
            if (stitchingArea > 0 && product.blindType) {
              const rateFieldName = blindTypeToRateField[product.blindType];
              if (rateFieldName && ratesObj[rateFieldName] > 0) {
                blindsCharges = Math.round(stitchingArea * ratesObj[rateFieldName]);
              }
            }
          } else {
            if (clothRequired > 0 && clothRatePerMeter > 0) {
              clothCharges = Math.round(clothRequired * clothRatePerMeter);
            }
            if (astarRequired > 0 && ratesObj.astarStitchingRate > 0) {
              astarCharges = Math.round(astarRequired * ratesObj.astarStitchingRate);
            }
            if (product.curtainType === "AP" && platesRequired > 0 && ratesObj.perPlateStitchingRate > 0) {
              stitchingCharges = Math.round(platesRequired * ratesObj.perPlateStitchingRate);
            } else if (product.curtainType === "Roman" && stitchingArea > 0 && ratesObj.perSqFtStitchingRate > 0) {
              stitchingCharges = Math.round(stitchingArea * ratesObj.perSqFtStitchingRate);
            }
            // Track charges only for AP type, not for Roman
            if (product.curtainType === "AP" && track > 0 && ratesObj.trackRatePerRunningFeet > 0) {
              trackCharges = Math.round(track * ratesObj.trackRatePerRunningFeet);
            }
          }
          
          const productTotal = product.curtainType === "Blinds" 
            ? blindsCharges 
            : product.curtainType === "Roman"
            ? clothCharges + astarCharges + stitchingCharges // No track charges for Roman
            : clothCharges + astarCharges + stitchingCharges + trackCharges;
          
          return {
            ...product,
            clothRequired,
            astarRequired,
            track,
            platesRequired,
            stitchingArea,
            clothRatePerMeter,
            clothCharges,
            astarCharges,
            stitchingCharges,
            trackCharges,
            blindsCharges,
            productTotal
          };
        });

        const grandTotal = productsWithDetails.reduce((sum, p) => sum + p.productTotal, 0);

        // Get today's date
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });

        return (
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered modal-xl" role="document" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-file-text me-2"></i>
                    Quotation Details
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleShowQuotationModalClose}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body" style={{ maxHeight: "80vh", overflowY: "auto" }}>
                  {/* Shop Details Header */}
                  {shopDetails && (
                    <div className="mb-4 pb-3" style={{ 
                      borderBottom: ratesForDisplay ? '3px double #000' : '1px solid #dee2e6',
                      paddingBottom: '1rem'
                    }}>
                      <div className="row align-items-start">
                        {shopDetails.logo && (
                          <div className="col-auto">
                            <img 
                              src={`${import.meta.env.VITE_API_URL}/api/uploadedImages/${shopDetails.logo}`} 
                              alt="Shop Logo" 
                              style={{ maxWidth: "60px", maxHeight: "60px" }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <div className="col">
                          {shopDetails.shopName && (
                            <div className="fw-bold fs-5 mb-2">{shopDetails.shopName}</div>
                          )}
                          {shopDetails.address && (
                            <div className="text-muted small mb-1">{shopDetails.address}</div>
                          )}
                          {shopDetails.emailId && (
                            <div className="text-muted small mb-1">Email: {shopDetails.emailId}</div>
                          )}
                          {shopDetails.mobileNumber && (
                            <div className="text-muted small mb-1">Mobile: {shopDetails.mobileNumber}</div>
                          )}
                          {shopDetails.gstNumber && (
                            <div className="text-muted small">GST: {shopDetails.gstNumber}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-end mb-3">
                    <span className="text-muted small">Date: {dateStr}</span>
                  </div>

                  {/* Heading */}
                  <div className="text-center mb-4">
                    <h4 className="fw-bold">
                      Quotation ({quotationToShow.quotationType === "curtain" ? "curtains" : quotationToShow.quotationType === "accessories" ? "accessories" : quotationToShow.quotationType || "items"})
                    </h4>
                  </div>

                  {/* Customer Details */}
                  {(quotationToShow.customerName || quotationToShow.address || quotationToShow.whatsappNumber) && (
                    <div className="mb-4">
                      <div className="text-muted small">
                        {[quotationToShow.customerName, quotationToShow.address, quotationToShow.whatsappNumber].filter(Boolean).join(" | ")}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {productsWithDetails.length > 0 ? (
                    <div>
                      {(() => {
                        // Group products by place
                        const groupedByPlace = {};
                        productsWithDetails.forEach((product, originalIndex) => {
                          const place = product.place || "Unspecified";
                          if (!groupedByPlace[place]) {
                            groupedByPlace[place] = [];
                          }
                          groupedByPlace[place].push({ ...product, originalIndex });
                        });
                        
                        // Sort places alphabetically
                        const sortedPlaces = Object.keys(groupedByPlace).sort();
                        
                        return sortedPlaces.map((place, placeIndex) => {
                          const placeProducts = groupedByPlace[place];
                          const placeTotal = placeProducts.reduce((sum, p) => sum + p.productTotal, 0);
                          
                          return (
                            <div key={placeIndex} className="mb-4">
                              {/* Place Header */}
                              <div className="fw-bold fs-5 mb-3 pb-2 border-bottom">
                                {placeIndex + 1}. {place} ({placeProducts.length})
                              </div>
                              
                              {/* Products for this place */}
                              {placeProducts.map((product, productIndex) => {
                                let catalogNumber = product.catalog;
                                if (!catalogNumber && product.catalogId && catalogList) {
                                  const catalog = catalogList.find(c => c._id === product.catalogId);
                                  if (catalog && catalog.number) {
                                    catalogNumber = catalog.number;
                                  }
                                }

                                return (
                                  <div key={productIndex} className="mb-4 border-bottom pb-4">
                                    {/* Product Header */}
                                    <div className="fw-semibold fs-6 mb-2 text-muted">
                                      {productIndex + 1}.
                                    </div>

                                    {/* Dimensions */}
                                    {(product.height || product.width) && (
                                      <div className="mb-1">
                                        <span className="text-muted">Dimensions: </span>
                                        {[product.height, product.width].filter(Boolean).join(" x ")}
                                      </div>
                                    )}

                                    {/* Type */}
                                    <div className="mb-1">
                                      <span className="text-muted">Type: </span>
                                      {product.curtainType || "N/A"}
                                    </div>

                                    {/* Catalog No. */}
                                    {product.curtainType !== "Blinds" && catalogNumber && (
                                      <div className="mb-3">
                                        <span className="text-muted">Catalog No.: </span>
                                        {catalogNumber}
                                      </div>
                                    )}

                                    {/* Dashed line */}
                                    <hr className="border-dashed" style={{ borderStyle: "dashed", borderWidth: "1px" }} />

                                    {/* Line Items */}
                                    <div className="mt-3">
                                      <div className="row mb-2">
                                        <div className="col-3">
                                          {product.curtainType === "Blinds" ? (
                                            <span>{product.stitchingArea} sq.ft</span>
                                          ) : (
                                            <span>{product.clothRequired} meter</span>
                                          )}
                                        </div>
                                        <div className="col-4">
                                          {product.curtainType === "Blinds" ? "curtain cost" : "Cloth"}
                                        </div>
                                        <div className="col-3 text-muted small">
                                          {product.curtainType === "Blinds" ? (
                                            (() => {
                                              const blindTypeToRateField = {
                                                "Customised": "customisedBlindRate",
                                                "Fabric Blind": "fabricBlindRate",
                                                "Eco-Blackout": "ecoBlackoutBlindRate",
                                                "Vertical": "verticalBlindRate",
                                                "Zebra": "zebraBlindRate"
                                              };
                                              const rateFieldName = product.blindType ? blindTypeToRateField[product.blindType] : null;
                                              const rate = rateFieldName ? ratesObj[rateFieldName] : 0;
                                              return <>Rs. {Math.round(rate)}/- per sq.ft</>;
                                            })()
                                          ) : (
                                            <>Rs. {Math.round(product.clothRatePerMeter)} per meter</>
                                          )}
                                        </div>
                                        <div className="col-2 text-end fw-semibold">
                                          Rs. {product.curtainType === "Blinds" ? product.blindsCharges : product.clothCharges}/-
                                        </div>
                                      </div>

                                      {/* Astar - for AP and Roman */}
                                      {product.astarRequired > 0 && product.curtainType !== "Blinds" && product.astarCharges > 0 && (
                                        <div className="row mb-2">
                                          <div className="col-3">{product.astarRequired} meter</div>
                                          <div className="col-4">Astar</div>
                                          <div className="col-3 text-muted small">
                                            Rs. {formatRate(ratesObj.astarStitchingRate)}/- per meter
                                          </div>
                                          <div className="col-2 text-end fw-semibold">
                                            Rs. {product.astarCharges}/-
                                          </div>
                                        </div>
                                      )}

                                      {/* Stitching */}
                                      {product.curtainType === "AP" && product.platesRequired > 0 && product.stitchingCharges > 0 && (
                                        <div className="row mb-2">
                                          <div className="col-3">{product.platesRequired} plates</div>
                                          <div className="col-4">stitching</div>
                                          <div className="col-3 text-muted small">
                                            Rs. {formatRate(ratesObj.perPlateStitchingRate)}/- per plate
                                          </div>
                                          <div className="col-2 text-end fw-semibold">
                                            Rs. {product.stitchingCharges}/-
                                          </div>
                                        </div>
                                      )}
                                      {product.curtainType === "Roman" && product.stitchingArea > 0 && product.stitchingCharges > 0 && (
                                        <div className="row mb-2">
                                          <div className="col-3">{product.stitchingArea} sq.ft</div>
                                          <div className="col-4">stitching</div>
                                          <div className="col-3 text-muted small">
                                            Rs. {formatRate(ratesObj.perSqFtStitchingRate)}/- per sq.ft
                                          </div>
                                          <div className="col-2 text-end fw-semibold">
                                            Rs. {product.stitchingCharges}/-
                                          </div>
                                        </div>
                                      )}

                                      {/* Track - only for AP type, not for Roman */}
                                      {product.track > 0 && product.curtainType === "AP" && product.trackCharges > 0 && (
                                        <div className="row mb-2">
                                          <div className="col-3">{product.track} feet</div>
                                          <div className="col-4">track</div>
                                          <div className="col-3 text-muted small">
                                            Rs. {formatRate(ratesObj.trackRatePerRunningFeet)}/- running feet
                                          </div>
                                          <div className="col-2 text-end fw-semibold">
                                            Rs. {product.trackCharges}/-
                                          </div>
                                        </div>
                                      )}

                                      {/* Product Total */}
                                      <div className="row mt-3 pt-2 border-top">
                                        <div className="col-9 fw-bold">Total</div>
                                        <div className="col-3 text-end fw-bold">
                                          Rs. {product.productTotal}/-
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Place Subtotal */}
                              {placeProducts.length > 1 && (
                                <div className="row mt-3 pt-2 border-top">
                                  <div className="col-9 fw-semibold">Subtotal for {place}</div>
                                  <div className="col-3 text-end fw-semibold">
                                    Rs. {placeTotal}/-
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}

                      {/* Grand Total */}
                      <div className="row mt-4 pt-3 border-top">
                        <div className="col-9 fw-bold fs-6 fs-md-5">Grand Total</div>
                        <div className="col-3 text-end fw-bold fs-6 fs-md-5">
                          Rs. {grandTotal}/-
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      {quotationToShow.products && quotationToShow.products.length > 0 
                        ? "Select the curtain type first." 
                        : "No curtain products found in this quotation."}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {quotationToShow.quotationType === "curtain" && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={async () => {
                        // Download PDF with the rates being displayed (standard or customised)
                        const ratesToUseForDownload = ratesForDisplay || ratesData;
                        const isCustomised = !!ratesForDisplay; // If ratesForDisplay exists, it means customised rates are being used
                        await ExportQuotationToPDF(quotationToShow, catalogList, ratesToUseForDownload, shopDetails, isCustomised, import.meta.env.VITE_API_URL);
                      }}
                    >
                      <i className="bi bi-download me-2"></i>
                      Download PDF
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleShowQuotationModalClose}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* View Quotation Confirmation Modal - shown after updating quotation */}
      {showViewQuotationModal && (
        <Modal
          heading="Quotation Updated"
          modalText="Want to see the quotation?"
          btnGroup={["Yes", "No"]}
          onModalCloseClick={handleViewQuotationModalClose}
          onModalButtonClick={handleViewQuotationModalButtonClick}
        />
      )}
      </div>
    </>
  );
}

