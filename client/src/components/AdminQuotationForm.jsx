import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import "../formstyles.css";
import formLayout from "./FormLayout";
import axios from "./AxiosInstance";
import Modal from "./Modal";

const AdminQuotationForm = forwardRef(function AdminQuotationForm(props, ref) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [quotation, setQuotation] = useState("");
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [enquiryCode, setEnquiryCode] = useState("");
  let [productToDeleteIndex, setProductToDeleteIndex] = useState(null);
  let [filteredCatalogList, setFilteredCatalogList] = useState([]);
  let [originalProducts, setOriginalProducts] = useState([]); // Store original products to detect changes
  let [modifiedProductIndex, setModifiedProductIndex] = useState(null); // Track which product has unsaved changes
  let [showAddProductModal, setShowAddProductModal] = useState(false); // Modal state for adding product
  let [modalPlaceName, setModalPlaceName] = useState(null); // Place name for modal title when opened from place-specific button
  let [newProduct, setNewProduct] = useState({ // New product data for modal
    productName: "",
    place: "",
    length: "",
    width: "",
    height: "",
    curtainType: "",
    blindType: "",
    companyId: "",
    company: "",
    catalogId: "",
    catalog: ""
  });
  let [filteredCatalogListModal, setFilteredCatalogListModal] = useState([]); // Filtered catalogs for modal
  let { emptyQuotation } = props;
  let { quotationToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { companyList = [] } = props;
  let { catalogList = [] } = props;
  let { ratesData = null } = props;
  
  // Product options
  const productOptions = [
    "Curtains",
    "Wall Papers",
    "Mattresses",
    "Pillows",
    "Bed Sheets",
    "Cushions",
    "Blinds",
    "Shades",
    "Rugs",
    "Carpets"
  ];
  
  // Place options
  const placeOptions = [
    "Hall",
    "Master Bedroom",
    "Living Room",
    "Terrace",
    "Kitchen",
    "Guest Bedroom",
    "Bathroom",
    "Balcony",
    "Study Room",
    "Dining Room",
    "Kids Room",
    "Store Room"
  ];
  
  // Product field requirements mapping
  const productFieldRequirements = {
    "Curtains": { showLength: false, showWidth: true, showHeight: true, lengthLabel: "", widthLabel: "Width", heightLabel: "Height" },
    "Bed Sheets": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Mattresses": { showLength: true, showWidth: true, showHeight: true, lengthLabel: "Length", widthLabel: "Width", heightLabel: "Height" },
    "Wall Papers": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Pillows": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Cushions": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Blinds": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Shades": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Rugs": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" },
    "Carpets": { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" }
  };
  
  function getProductFields(productName) {
    return productFieldRequirements[productName] || { showLength: true, showWidth: true, showHeight: false, lengthLabel: "Length", widthLabel: "Width", heightLabel: "" };
  }
  
  // Helper function to filter catalogs by companyId or company name
  // Handles both user-entered catalogs (with companyId) and Excel-imported catalogs (with company field)
  function filterCatalogsByCompany(companyId, companyName) {
    if (!companyId && !companyName) {
      return [];
    }
    
    return catalogList.filter(catalog => {
      // For user-entered catalogs: match by companyId
      if (catalog.companyId && companyId) {
        if (String(catalog.companyId) === String(companyId)) {
          return true;
        }
      }
      
      // For Excel-imported catalogs: match by company name
      // Excel-imported catalogs have a 'company' field (string) instead of/in addition to companyId
      if (catalog.company && companyName) {
        const catalogCompany = String(catalog.company || "").trim().toLowerCase();
        const targetCompany = String(companyName || "").trim().toLowerCase();
        if (catalogCompany === targetCompany) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, [quotationToBeEdited]);
  
  async function init() {
    let { action } = props;
    if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyQuotation).filter(
        (key) => !Object.keys(quotationToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        quotationToBeEdited[key] = emptyQuotation[key];
      });
      // Ensure products array exists
      if (!quotationToBeEdited.products || !Array.isArray(quotationToBeEdited.products)) {
        quotationToBeEdited.products = [];
      }
      setQuotation({ ...quotationToBeEdited });
      // Store original products for change detection
      setOriginalProducts(JSON.parse(JSON.stringify(quotationToBeEdited.products || [])));
      setModifiedProductIndex(null);
      
      // Fetch enquiry code if enquiryId exists
      if (quotationToBeEdited.enquiryId) {
        try {
          let response = await axios.get(`/enquiries/${quotationToBeEdited.enquiryId}`);
          let enquiry = await response.data;
          if (enquiry && enquiry.code) {
            setEnquiryCode(enquiry.code);
          }
        } catch (error) {
          console.error("Error fetching enquiry code:", error);
          setEnquiryCode("");
        }
      }
    }
  }
  
  // Helper function to recalculate product fields based on curtain type
  function recalculateProductFields(product) {
    const updatedProduct = { ...product };
    
    if (updatedProduct.curtainType === "AP") {
      const height = parseFloat(updatedProduct.height);
      const width = parseFloat(updatedProduct.width);
      
      if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
        updatedProduct.platesRequired = Math.ceil(width / 21);
        updatedProduct.clothRequired = Math.ceil(((height + 12) / 36) * updatedProduct.platesRequired);
        updatedProduct.astarRequired = updatedProduct.clothRequired;
        updatedProduct.track = Math.ceil(width / 12);
        
        // Calculate charges
        let clothCharges = 0;
        let astarCharges = 0;
        let stitchingCharges = 0;
        let trackCharges = 0;
        
        if (updatedProduct.catalogId && catalogList.length > 0) {
          const catalog = catalogList.find(c => c._id === updatedProduct.catalogId);
          if (catalog && catalog.priceInRs) {
            clothCharges = Math.round(updatedProduct.clothRequired * parseFloat(catalog.priceInRs));
          }
        }
        if (ratesData && ratesData.astarStitchingRate) {
          astarCharges = Math.round(updatedProduct.astarRequired * parseFloat(ratesData.astarStitchingRate));
        }
        if (ratesData && ratesData.perPlateStitchingRate) {
          stitchingCharges = Math.round(updatedProduct.platesRequired * parseFloat(ratesData.perPlateStitchingRate));
        }
        if (ratesData && ratesData.trackRatePerRunningFeet) {
          trackCharges = Math.round(updatedProduct.track * parseFloat(ratesData.trackRatePerRunningFeet));
        }
        
        updatedProduct.clothCharges = clothCharges;
        updatedProduct.astarCharges = astarCharges;
        updatedProduct.stitchingCharges = stitchingCharges;
        updatedProduct.trackCharges = trackCharges;
      }
    } else if (updatedProduct.curtainType === "Roman") {
      const height = parseFloat(updatedProduct.height);
      const width = parseFloat(updatedProduct.width);
      
      if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
        const roundToHalfOrInteger = (value) => {
          const floor = Math.floor(value);
          const decimal = value - floor;
          return decimal <= 0.5 ? floor + 0.5 : floor + 1;
        };
        
        updatedProduct.clothMultiplier = Math.round(width / 44);
        updatedProduct.clothRequired = roundToHalfOrInteger(((height + 15) / 36) * updatedProduct.clothMultiplier);
        updatedProduct.astarRequired = updatedProduct.clothRequired;
        updatedProduct.track = 0;
        updatedProduct.stitchingArea = Math.ceil((width * height) / 144);
        
        // Calculate charges
        let clothCharges = 0;
        let astarCharges = 0;
        let stitchingCharges = 0;
        
        if (updatedProduct.catalogId && catalogList.length > 0) {
          const catalog = catalogList.find(c => c._id === updatedProduct.catalogId);
          if (catalog && catalog.priceInRs) {
            clothCharges = Math.round(updatedProduct.clothRequired * parseFloat(catalog.priceInRs));
          }
        }
        if (ratesData && ratesData.astarStitchingRate) {
          astarCharges = Math.round(updatedProduct.astarRequired * parseFloat(ratesData.astarStitchingRate));
        }
        if (ratesData && ratesData.perSqFtStitchingRate) {
          stitchingCharges = Math.round(updatedProduct.stitchingArea * parseFloat(ratesData.perSqFtStitchingRate));
        }
        
        updatedProduct.clothCharges = clothCharges;
        updatedProduct.astarCharges = astarCharges;
        updatedProduct.stitchingCharges = stitchingCharges;
        updatedProduct.trackCharges = 0;
      }
    } else if (updatedProduct.curtainType === "Blinds") {
      const height = parseFloat(updatedProduct.height);
      const width = parseFloat(updatedProduct.width);
      
      if (!isNaN(height) && height > 0 && !isNaN(width) && width > 0) {
        updatedProduct.stitchingArea = Math.round((width * height) / 144);
        
        const blindTypeToRateField = {
          "Customised": "customisedBlindRate",
          "Fabric Blind": "fabricBlindRate",
          "Eco-Blackout": "ecoBlackoutBlindRate",
          "Vertical": "verticalBlindRate",
          "Zebra": "zebraBlindRate"
        };
        
        let clothCharges = 0;
        if (ratesData && updatedProduct.blindType) {
          const rateFieldName = blindTypeToRateField[updatedProduct.blindType];
          if (rateFieldName && ratesData[rateFieldName]) {
            clothCharges = Math.round(updatedProduct.stitchingArea * parseFloat(ratesData[rateFieldName]));
          }
        }
        
        updatedProduct.clothCharges = clothCharges;
        updatedProduct.astarCharges = 0;
        updatedProduct.stitchingCharges = 0;
        updatedProduct.trackCharges = 0;
      }
    }
    
    return updatedProduct;
  }
  
  function handleProductFieldChange(index, field, value) {
    const updatedProducts = [...quotation.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    // Recalculate fields if curtain-related fields changed
    if (quotation.quotationType === "curtain" && 
        (field === "curtainType" || field === "height" || field === "width" || field === "blindType" || field === "catalogId")) {
      updatedProducts[index] = recalculateProductFields(updatedProducts[index]);
    }
    
    setQuotation({ ...quotation, products: updatedProducts });
    
    // Check if this product has been modified
    const originalProduct = originalProducts[index];
    const currentProduct = updatedProducts[index];
    
    // Compare all relevant fields
    const hasChanges = !originalProduct || 
      originalProduct.productName !== currentProduct.productName ||
      originalProduct.place !== currentProduct.place ||
      String(originalProduct.length || "") !== String(currentProduct.length || "") ||
      String(originalProduct.width || "") !== String(currentProduct.width || "") ||
      String(originalProduct.height || "") !== String(currentProduct.height || "") ||
      originalProduct.curtainType !== currentProduct.curtainType ||
      originalProduct.blindType !== currentProduct.blindType ||
      String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
      String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
    
    if (hasChanges) {
      setModifiedProductIndex(index);
    } else {
      if (modifiedProductIndex === index) {
        setModifiedProductIndex(null);
      }
    }
  }
  
  // Helper function to update catalog fields together
  function handleCatalogChange(index, catalogName, catalogId) {
    const updatedProducts = [...quotation.products];
    updatedProducts[index] = { 
      ...updatedProducts[index], 
      catalog: catalogName || "",
      catalogId: catalogId || ""
    };
    
    // Recalculate fields if curtain-related
    if (quotation.quotationType === "curtain" && catalogId) {
      updatedProducts[index] = recalculateProductFields(updatedProducts[index]);
    }
    
    setQuotation({ ...quotation, products: updatedProducts });
    
    // Check if this product has been modified
    const originalProduct = originalProducts[index];
    const currentProduct = updatedProducts[index];
    
    const hasChanges = !originalProduct || 
      originalProduct.productName !== currentProduct.productName ||
      originalProduct.place !== currentProduct.place ||
      String(originalProduct.length || "") !== String(currentProduct.length || "") ||
      String(originalProduct.width || "") !== String(currentProduct.width || "") ||
      String(originalProduct.height || "") !== String(currentProduct.height || "") ||
      originalProduct.curtainType !== currentProduct.curtainType ||
      originalProduct.blindType !== currentProduct.blindType ||
      String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
      String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
    
    if (hasChanges) {
      setModifiedProductIndex(index);
    } else {
      if (modifiedProductIndex === index) {
        setModifiedProductIndex(null);
      }
    }
  }
  
  function handleSaveProductChanges(index) {
    // Update original products to reflect saved changes
    const updatedOriginalProducts = [...originalProducts];
    updatedOriginalProducts[index] = JSON.parse(JSON.stringify(quotation.products[index]));
    setOriginalProducts(updatedOriginalProducts);
    setModifiedProductIndex(null);
  }
  
  function handleDiscardProductChanges(index) {
    // Revert to original product
    const updatedProducts = [...quotation.products];
    updatedProducts[index] = JSON.parse(JSON.stringify(originalProducts[index]));
    setQuotation({ ...quotation, products: updatedProducts });
    setModifiedProductIndex(null);
  }
  
  function handleAddProductClick() {
    // Check if there's already an incomplete product (missing productName or place)
    if (quotation && quotation.products && quotation.products.length > 0) {
      const lastProduct = quotation.products[quotation.products.length - 1];
      if (!lastProduct.productName || !lastProduct.place) {
        return;
      }
    }
    // Get the last place and product name values from existing products, if any
    let lastPlace = "";
    let lastProductName = "";
    if (quotation && quotation.products && quotation.products.length > 0) {
      const lastProduct = quotation.products[quotation.products.length - 1];
      if (lastProduct) {
        if (lastProduct.place) {
          lastPlace = lastProduct.place;
        }
        if (lastProduct.productName) {
          lastProductName = lastProduct.productName;
        }
      }
    }
    // Initialize new product with last values
    setNewProduct({
      productName: lastProductName,
      place: lastPlace,
      length: "",
      width: "",
      height: "",
      curtainType: "",
      blindType: "",
      companyId: "",
      company: "",
      catalogId: "",
      catalog: ""
    });
    setModalPlaceName(null); // Clear place name for modal title when opened from general + button
    setShowAddProductModal(true);
  }

  function handleAddProductClickWithPlace(place) {
    // Check if there's already an incomplete product (missing productName or place)
    if (quotation && quotation.products && quotation.products.length > 0) {
      const lastProduct = quotation.products[quotation.products.length - 1];
      if (!lastProduct.productName || !lastProduct.place) {
        return;
      }
    }
    // Get the last product name value from existing products, if any
    let lastProductName = "";
    if (quotation && quotation.products && quotation.products.length > 0) {
      const lastProduct = quotation.products[quotation.products.length - 1];
      if (lastProduct && lastProduct.productName) {
        lastProductName = lastProduct.productName;
      }
    }
    // Initialize new product with the specified place and last product name
    setNewProduct({
      productName: lastProductName,
      place: place,
      length: "",
      width: "",
      height: "",
      curtainType: "",
      blindType: "",
      companyId: "",
      company: "",
      catalogId: "",
      catalog: ""
    });
    setModalPlaceName(place); // Set place name for modal title
    setShowAddProductModal(true);
  }

  function handleNewProductChange(field, value) {
    setNewProduct({ ...newProduct, [field]: value });
  }

  function handleAddProductFromModal() {
    // Validate required fields
    if (!newProduct.productName || !newProduct.place) {
      setFlagFormInvalid(true);
      return;
    }
    
    // Create the complete product object
    const productToAdd = {
      productName: newProduct.productName,
      place: newProduct.place,
      length: newProduct.length || "",
      width: newProduct.width || "",
      height: newProduct.height || "",
      curtainType: newProduct.curtainType || "",
      blindType: newProduct.blindType || "",
      companyId: newProduct.companyId || "",
      company: newProduct.company || "",
      catalogId: newProduct.catalogId || "",
      catalog: newProduct.catalog || "",
      clothRequired: "",
      platesRequired: "",
      astarRequired: "",
      track: "",
      stitchingArea: "",
      clothMultiplier: "",
      clothCharges: "",
      astarCharges: "",
      stitchingCharges: "",
      trackCharges: ""
    };
    
    // Add product to quotation
    const updatedProducts = [...(quotation.products || []), productToAdd];
    setQuotation({ ...quotation, products: updatedProducts });
    // Add to original products as well (so it's not marked as modified initially)
    setOriginalProducts([...originalProducts, JSON.parse(JSON.stringify(productToAdd))]);
    
    // Reset modal state
    setNewProduct({
      productName: "",
      place: "",
      length: "",
      width: "",
      height: "",
      curtainType: "",
      blindType: "",
      companyId: "",
      company: "",
      catalogId: "",
      catalog: ""
    });
    setFilteredCatalogListModal([]);
    setModalPlaceName(null); // Clear place name for modal title
    setShowAddProductModal(false);
    setFlagFormInvalid(false);
  }

  function handleCancelAddProduct() {
    setNewProduct({
      productName: "",
      place: "",
      length: "",
      width: "",
      height: "",
      curtainType: "",
      blindType: "",
      companyId: "",
      company: "",
      catalogId: "",
      catalog: ""
    });
    setFilteredCatalogListModal([]);
    setModalPlaceName(null); // Clear place name for modal title
    setShowAddProductModal(false);
    setFlagFormInvalid(false);
  }
  
  
  function handleRemoveProductClick(index) {
    setProductToDeleteIndex(index);
  }
  
  function handleCancelProductDelete() {
    setProductToDeleteIndex(null);
  }
  
  function handleConfirmProductDelete() {
    if (productToDeleteIndex !== null && quotation.products.length > 1) {
      const updatedProducts = quotation.products.filter((_, i) => i !== productToDeleteIndex);
      setQuotation({ ...quotation, products: updatedProducts });
      setProductToDeleteIndex(null);
    }
  }
  
  function handleCurrentProductChange(field, value) {
    setCurrentProduct({ ...currentProduct, [field]: value });
  }
  
  useImperativeHandle(ref, () => ({
    submitForm: () => {
      handleFormSubmit();
    },
  }));
  
  function handleFormSubmit() {
    setFlagFormInvalid(true);
    // For quotations, we only need to validate that products exist
    if (!quotation.products || quotation.products.length === 0) {
      return;
    }
    
    // Before submitting, ensure all current product changes are included
    // This ensures that catalogId and other fields are properly set even if individual "Save" wasn't clicked
    let quotationToSubmit = { ...quotation };
    
    // Ensure all products have their latest changes, including catalogId
    if (quotationToSubmit.products && Array.isArray(quotationToSubmit.products)) {
      quotationToSubmit.products = quotationToSubmit.products.map((product, index) => {
        // Get the current product from quotation state (which has all latest changes)
        let currentProduct = { ...quotation.products[index] };
        
        // CRITICAL: Ensure catalogId is set if catalog name exists
        // This is the final checkpoint before submission
        if (currentProduct.catalog && currentProduct.catalog.trim() !== "" && currentProduct.companyId && catalogList.length > 0) {
          // Get filtered catalogs for this product's company
          // Find company name for Excel-imported catalog matching
          const selectedCompany = companyList.find(c => String(c._id) === String(currentProduct.companyId));
          const companyName = selectedCompany ? selectedCompany.name : currentProduct.company;
          const productFilteredCatalogs = filterCatalogsByCompany(currentProduct.companyId, companyName);
          
          // If catalogId is missing or empty, try to match it
          if (!currentProduct.catalogId || currentProduct.catalogId === "") {
            // Try multiple matching strategies
            let matchedCatalog = findCatalogMatch(currentProduct.catalog, productFilteredCatalogs);
            
            // If no match, try a more aggressive search - check if any catalog name/number contains the input
            if (!matchedCatalog) {
              const catalogNameLower = currentProduct.catalog.toLowerCase().trim();
              matchedCatalog = productFilteredCatalogs.find(catalog => {
                const name = String(catalog.name || "").toLowerCase().trim();
                const number = String(catalog.number || "").toLowerCase().trim();
                return name === catalogNameLower || number === catalogNameLower ||
                       name.includes(catalogNameLower) || number.includes(catalogNameLower) ||
                       catalogNameLower.includes(name) || catalogNameLower.includes(number);
              });
            }
            
            if (matchedCatalog) {
              currentProduct.catalogId = matchedCatalog._id;
              // Update catalog name to the matched catalog's name/number for consistency
              currentProduct.catalog = matchedCatalog.name || matchedCatalog.number || currentProduct.catalog;
              
              // Recalculate fields if curtain-related and catalogId was just set
              if (quotation.quotationType === "curtain" && currentProduct.curtainType) {
                currentProduct = recalculateProductFields(currentProduct);
              }
            } else {
              // If we still can't match, log a warning but continue
              console.warn(`Could not match catalog "${currentProduct.catalog}" for product ${index + 1}. Available catalogs:`, 
                productFilteredCatalogs.map(c => c.name || c.number));
            }
          } else {
            // catalogId exists - verify it's still valid
            const catalogExists = catalogList.find(c => c._id === currentProduct.catalogId);
            if (!catalogExists) {
              // Catalog ID doesn't exist in list, try to rematch by name
              let matchedCatalog = findCatalogMatch(currentProduct.catalog, productFilteredCatalogs);
              
              // If no match, try more aggressive search
              if (!matchedCatalog) {
                const catalogNameLower = currentProduct.catalog.toLowerCase().trim();
                matchedCatalog = productFilteredCatalogs.find(catalog => {
                  const name = String(catalog.name || "").toLowerCase().trim();
                  const number = String(catalog.number || "").toLowerCase().trim();
                  return name === catalogNameLower || number === catalogNameLower ||
                         name.includes(catalogNameLower) || number.includes(catalogNameLower) ||
                         catalogNameLower.includes(name) || catalogNameLower.includes(number);
                });
              }
              
              if (matchedCatalog) {
                currentProduct.catalogId = matchedCatalog._id;
                currentProduct.catalog = matchedCatalog.name || matchedCatalog.number || currentProduct.catalog;
              } else {
                // Can't rematch, clear the invalid catalogId
                console.warn(`Invalid catalogId "${currentProduct.catalogId}" for catalog "${currentProduct.catalog}", clearing it`);
                currentProduct.catalogId = "";
              }
            }
          }
        } else if (currentProduct.catalogId && (!currentProduct.catalog || currentProduct.catalog.trim() === "")) {
          // If catalogId exists but catalog name is missing, try to restore it
          const catalog = catalogList.find(c => c._id === currentProduct.catalogId);
          if (catalog) {
            currentProduct.catalog = catalog.name || catalog.number || "";
          }
        }
        
        return currentProduct;
      });
    }
    
    // Final verification and last-chance fix: Ensure all products with catalog names have catalogIds
    if (quotationToSubmit.products && Array.isArray(quotationToSubmit.products)) {
      quotationToSubmit.products = quotationToSubmit.products.map((product, idx) => {
        // If catalog name exists but catalogId is missing, this is our last chance to fix it
        if (product.catalog && product.catalog.trim() !== "" && (!product.catalogId || product.catalogId === "") && product.companyId && catalogList.length > 0) {
          console.warn(`Product ${idx + 1} has catalog "${product.catalog}" but no catalogId - attempting final match`);
          // Find company name for Excel-imported catalog matching
          const selectedCompany = companyList.find(c => String(c._id) === String(product.companyId));
          const companyName = selectedCompany ? selectedCompany.name : product.company;
          const productFilteredCatalogs = filterCatalogsByCompany(product.companyId, companyName);
          
          // Try multiple matching strategies as last resort
          let matchedCatalog = findCatalogMatch(product.catalog, productFilteredCatalogs);
          if (!matchedCatalog) {
            const catalogNameLower = product.catalog.toLowerCase().trim();
            matchedCatalog = productFilteredCatalogs.find(catalog => {
              const name = String(catalog.name || "").toLowerCase().trim();
              const number = String(catalog.number || "").toLowerCase().trim();
              return name === catalogNameLower || number === catalogNameLower ||
                     name.includes(catalogNameLower) || number.includes(catalogNameLower) ||
                     catalogNameLower.includes(name) || catalogNameLower.includes(number);
            });
          }
          
          if (matchedCatalog) {
            product.catalogId = matchedCatalog._id;
            product.catalog = matchedCatalog.name || matchedCatalog.number || product.catalog;
            console.log(`Successfully matched catalog "${product.catalog}" to ID "${product.catalogId}"`);
          } else {
            console.error(`FAILED to match catalog "${product.catalog}" for product ${idx + 1}. Available:`, 
              productFilteredCatalogs.map(c => c.name || c.number));
          }
        }
        return product;
      });
    }
    
    // Update originalProducts to reflect that all changes are now being saved
    setOriginalProducts(JSON.parse(JSON.stringify(quotationToSubmit.products || [])));
    setModifiedProductIndex(null);
    
    props.onFormSubmit(quotationToSubmit);
  }
  
  const formRef = useRef(null);
  
  // Helper function to find catalog match from input value
  function findCatalogMatch(inputValue, catalogs) {
    if (!inputValue || !catalogs || catalogs.length === 0) return null;
    
    const trimmedValue = String(inputValue).trim();
    if (trimmedValue === "") return null;
    
    const lowerInput = trimmedValue.toLowerCase();
    
    // Try exact match first (case-insensitive)
    let selectedCatalog = catalogs.find(c => {
      const catalogName = String(c.name || c.number || "").trim();
      if (!catalogName) return false;
      return catalogName === trimmedValue || catalogName.toLowerCase() === lowerInput;
    });
    
    if (selectedCatalog) return selectedCatalog;
    
    // Try to match by checking if input starts with catalog name
    // This handles cases where browser includes display text from datalist
    selectedCatalog = catalogs.find(catalog => {
      const catalogName = String(catalog.name || catalog.number || "").trim();
      if (!catalogName) return false;
      
      const lowerCatalogName = catalogName.toLowerCase();
      
      // Check if input starts with catalog name (handles "Catalog Name - Rs. 100..." format)
      if (lowerInput.startsWith(lowerCatalogName)) {
        // Make sure it's a word boundary (not just a substring)
        const nextChar = trimmedValue[catalogName.length];
        if (!nextChar || nextChar === ' ' || nextChar === '-' || nextChar === '\t') {
          return true;
        }
      }
      
      // Check if input matches pattern "Catalog Name - Rs." or similar variations
      const escapedName = catalogName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`^${escapedName}\\s*-\\s*Rs\\.`, 'i'),
        new RegExp(`^${escapedName}\\s*-`, 'i'),
        new RegExp(`^${escapedName}`, 'i')
      ];
      
      return patterns.some(pattern => pattern.test(trimmedValue));
    });
    
    return selectedCatalog || null;
  }
  
  return (
    <div className="customer-form-wrapper my-3">
      <form ref={formRef} className="text-thick p-4">
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              Update Quotation - {quotation.quotationType ? quotation.quotationType.charAt(0).toUpperCase() + quotation.quotationType.slice(1) : ""}
            </h5>
            <p className="customer-form-subtitle mb-0">
              View and manage quotation details and products.
            </p>
          </div>
          
          {/* Read-only information displayed as text */}
          <div className="col-12 mb-3">
            <div className="d-flex flex-wrap gap-3 align-items-center form-text-responsive">
              <div>
                <span className="text-muted fw-semibold me-2">Customer:</span>
                <span>{quotation.customerName || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted fw-semibold me-2">WhatsApp:</span>
                <span>{quotation.whatsappNumber || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted fw-semibold me-2">Enquiry Code:</span>
                <span>{enquiryCode || quotation.enquiry || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted fw-semibold me-2">Type:</span>
                <span>{quotation.quotationType ? quotation.quotationType.charAt(0).toUpperCase() + quotation.quotationType.slice(1) : "N/A"}</span>
              </div>
            </div>
          </div>
          
          {/* Products Section - Inline Editing */}
          <div className="col-12 my-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Products</h5>
            </div>
            
            {/* Product Form for Add/Edit - REMOVED, using inline editing instead */}
            {false && (
              <div className="card mb-2" style={{ border: "2px solid #0d6efd", borderRadius: "0.5rem" }}>
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold form-text-responsive">
                    {editingProductIndex !== null ? `Edit Product #${editingProductIndex + 1}` : "Add New Product"}
                  </span>
                </div>
                <div className="card-body py-2">
                  <div className="row g-2">
                    {/* Product Name */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1 form-label-responsive">Product Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        list="productOptions"
                        value={currentProduct.productName || ""}
                        onChange={(e) => handleCurrentProductChange("productName", e.target.value)}
                        placeholder="Select or type product name"
                      />
                      <datalist id="productOptions">
                        {productOptions.map((option, optIndex) => (
                          <option value={option} key={optIndex} />
                        ))}
                      </datalist>
                      {flagFormInvalid && (!currentProduct.productName || currentProduct.productName.trim() === "") && (
                        <span className="form-error-message">
                          <i className="bi bi-exclamation-circle"></i>
                          Product name is required
                        </span>
                      )}
                    </div>
                    
                    {/* Place */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-1 form-label-responsive">Place</label>
                      <select
                        className="form-control form-control-sm"
                        value={currentProduct.place || ""}
                        onChange={(e) => handleCurrentProductChange("place", e.target.value)}
                      >
                        <option value="">-- Select Place --</option>
                        {placeOptions.map((option, optIndex) => (
                          <option value={option} key={optIndex}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {flagFormInvalid && (!currentProduct.place || currentProduct.place.trim() === "") && (
                        <span className="form-error-message">
                          <i className="bi bi-exclamation-circle"></i>
                          Place is required
                        </span>
                      )}
                    </div>
                    
                    {/* Height */}
                    {(() => {
                      const fields = getProductFields(currentProduct.productName);
                      return (
                        <>
                          {fields.showHeight && (
                            <div className="col-md-4">
                              <label className="form-label fw-semibold mb-1 form-label-responsive">{fields.heightLabel} (inches)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={currentProduct.height || ""}
                                onChange={(e) => handleCurrentProductChange("height", e.target.value)}
                                placeholder={`Enter ${fields.heightLabel.toLowerCase()}`}
                                step="0.01"
                                min="0"
                              />
                              {flagFormInvalid && (!currentProduct.height || isNaN(parseFloat(currentProduct.height))) && (
                                <span className="form-error-message">
                                  <i className="bi bi-exclamation-circle"></i>
                                  Valid height is required
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Width */}
                          {fields.showWidth && (
                            <div className="col-md-4">
                              <label className="form-label fw-semibold mb-1 form-label-responsive">{fields.widthLabel} (inches)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={currentProduct.width || ""}
                                onChange={(e) => handleCurrentProductChange("width", e.target.value)}
                                placeholder={`Enter ${fields.widthLabel.toLowerCase()}`}
                                step="0.01"
                                min="0"
                              />
                              {flagFormInvalid && (!currentProduct.width || isNaN(parseFloat(currentProduct.width))) && (
                                <span className="form-error-message">
                                  <i className="bi bi-exclamation-circle"></i>
                                  Valid width is required
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Length */}
                          {fields.showLength && (
                            <div className="col-md-4">
                              <label className="form-label fw-semibold mb-1 form-label-responsive">{fields.lengthLabel} (inches)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={currentProduct.length || ""}
                                onChange={(e) => handleCurrentProductChange("length", e.target.value)}
                                placeholder={`Enter ${fields.lengthLabel.toLowerCase()}`}
                                step="0.01"
                                min="0"
                              />
                              {flagFormInvalid && (!currentProduct.length || isNaN(parseFloat(currentProduct.length))) && (
                                <span className="form-error-message">
                                  <i className="bi bi-exclamation-circle"></i>
                                  Valid length is required
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    {/* Curtain Type - Only show for curtain quotations */}
                    {quotation.quotationType === "curtain" && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1 form-label-responsive">Curtain Type</label>
                        <select
                          className="form-control form-control-sm"
                          value={currentProduct.curtainType || ""}
                          onChange={(e) => {
                            handleCurrentProductChange("curtainType", e.target.value);
                            // Clear blind type when switching away from Blinds
                            if (e.target.value !== "Blinds") {
                              setCurrentProduct(prev => ({ ...prev, blindType: "" }));
                            }
                          }}
                        >
                          <option value="">-- Select Curtain Type --</option>
                          <option value="AP">AP</option>
                          <option value="Roman">Roman</option>
                          <option value="Blinds">Blinds</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Blind Type - Only show when curtain type is Blinds */}
                    {quotation.quotationType === "curtain" && currentProduct.curtainType === "Blinds" && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1 form-label-responsive">Blind Type</label>
                        <select
                          className="form-control form-control-sm"
                          value={currentProduct.blindType || ""}
                          onChange={(e) => handleCurrentProductChange("blindType", e.target.value)}
                          required
                        >
                          <option value="">-- Select Blind Type --</option>
                          <option value="Customised">Customised</option>
                          <option value="Fabric Blind">Fabric Blind</option>
                          <option value="Eco-Blackout">Eco-Blackout</option>
                          <option value="Vertical">Vertical</option>
                          <option value="Zebra">Zebra</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Company - Only show for curtain quotations, but not for Blinds */}
                    {quotation.quotationType === "curtain" && currentProduct.curtainType !== "Blinds" && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1 form-label-responsive">Company</label>
                        <select
                          className="form-control form-control-sm"
                          value={currentProduct.company || ""}
                          onChange={(e) => {
                            const selectedIndex = e.target.selectedIndex;
                            const selectedOption = e.target.options[selectedIndex];
                            const companyId = selectedOption.id;
                            const companyValue = selectedOption.value;
                            setCurrentProduct({ ...currentProduct, company: companyValue, companyId: companyId });
                            // Update filtered catalog list for the dropdown
                            if (companyId) {
                              const filtered = filterCatalogsByCompany(companyId, companyValue);
                              setFilteredCatalogList(filtered);
                            } else {
                              setFilteredCatalogList([]);
                            }
                          }}
                        >
                          <option value="">-- Select Company --</option>
                          {companyList && companyList.map((company, index) => (
                            <option value={company.name} key={index} id={company._id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Catalog - Only show for curtain quotations, but not for Blinds */}
                    {quotation.quotationType === "curtain" && currentProduct.curtainType !== "Blinds" && (
                      <div className="col-md-6">
                        <label className="form-label fw-semibold mb-1 form-label-responsive">Catalog</label>
                        <select
                          className="form-control form-control-sm"
                          value={currentProduct.catalog || ""}
                          onChange={(e) => {
                            const selectedIndex = e.target.selectedIndex;
                            const selectedOption = e.target.options[selectedIndex];
                            const catalogId = selectedOption.id;
                            const catalogValue = selectedOption.value;
                            setCurrentProduct({ ...currentProduct, catalog: catalogValue, catalogId: catalogId });
                          }}
                          disabled={!currentProduct.companyId}
                        >
                          <option value="">{currentProduct.companyId ? "-- Select Catalog --" : "-- Select Company First --"}</option>
                          {filteredCatalogList && filteredCatalogList.map((catalog, index) => (
                            <option value={catalog.name || catalog.number || ""} key={catalog._id || index} id={catalog._id}>
                              {catalog.name || catalog.number || "Unnamed Catalog"} - Rs. {Math.round(parseFloat(catalog.priceInRs || 0))} per meter
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary me-2"
                      onClick={handleSaveProduct}
                    >
                      <i className="bi bi-check-circle me-1"></i>Save Product
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelProductForm}
                    >
                      <i className="bi bi-x-circle me-1"></i>Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {quotation.products && quotation.products.length > 0 ? (
              <>
                {(() => {
                  // Always group products by place for all actions
                  // Group products by place
                  const groupedByPlace = {};
                  quotation.products.forEach((product, originalIndex) => {
                    const place = product.place || "Unspecified";
                    if (!groupedByPlace[place]) {
                      groupedByPlace[place] = [];
                    }
                    groupedByPlace[place].push({ ...product, originalIndex });
                  });
                  
                  // Sort places alphabetically
                  const sortedPlaces = Object.keys(groupedByPlace).sort();
                  
                  return (
                    <>
                      <div>
                        {quotation.quotationType === "curtain" ? (
                            // Single table for curtain quotations with headings shown only once
                            <div className="table-responsive">
                              <table className="table table-bordered table-hover table-sm">
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ width: "4%", padding: "0.5rem" }}>#</th>
                                    <th style={{ width: "20%", padding: "0.5rem" }}>Product Name</th>
                                    <th style={{ width: "10%", padding: "0.5rem" }}>Height</th>
                                    <th style={{ width: "10%", padding: "0.5rem" }}>Width</th>
                                    <th style={{ width: "12%", padding: "0.5rem" }}>Curtain Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sortedPlaces.map((place, placeIndex) => {
                                    const placeProducts = groupedByPlace[place];
                                    return (
                                      <React.Fragment key={placeIndex}>
                                        <tr style={{ backgroundColor: "#b6d4fe" }}>
                                          <td colSpan={5} style={{ padding: "0.75rem", fontWeight: "bold", fontSize: "1.1rem", color: "#0a58ca" }}>
                                            <div className="d-flex justify-content-between align-items-center, p-2" style={{ backgroundColor: "#b6d4fe" }}>
                                              <span>Place: {place} ({placeProducts.length})</span>
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleAddProductClickWithPlace(place)}
                                                title="Add Product for this Place"
                                              >
                                                <i className="bi bi-plus-circle me-1"></i>Add
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                        {placeProducts.map((product, productIndex) => {
                                          const originalIndex = product.originalIndex;
                                          const fields = getProductFields(product.productName);
                                          const isModified = modifiedProductIndex === originalIndex;
                                          // Get filtered catalogs for this product's company
                                          // Handle both user-entered (companyId) and Excel-imported (company field) catalogs
                                          const selectedCompany = product.companyId ? companyList.find(c => String(c._id) === String(product.companyId)) : null;
                                          const companyName = selectedCompany ? selectedCompany.name : product.company;
                                          const productFilteredCatalogs = product.companyId || product.company
                                            ? filterCatalogsByCompany(product.companyId, companyName)
                                            : [];
                                          
                                          return (
                                            <React.Fragment key={originalIndex}>
                                              <tr>
                                                <td className="text-center" style={{ padding: "0.5rem" }}>{productIndex + 1}</td>
                                                <td style={{ padding: "0.5rem" }}>
                                                  <div style={{ position: "relative" }}>
                                                    <input
                                                      type="text"
                                                      className="form-control form-control-sm"
                                                      list={`productOptionsInline-${originalIndex}`}
                                                      value={product.productName || ""}
                                                      onChange={(e) => handleProductFieldChange(originalIndex, "productName", e.target.value)}
                                                      placeholder="Type or select product"
                                                      style={{ paddingRight: product.productName ? "2rem" : "0.5rem" }}
                                                    />
                                                    {product.productName && (
                                                      <button
                                                        type="button"
                                                        className="btn btn-sm p-0"
                                                        style={{
                                                          position: "absolute",
                                                          right: "0.5rem",
                                                          top: "50%",
                                                          transform: "translateY(-50%)",
                                                          background: "transparent",
                                                          border: "none",
                                                          color: "#6c757d",
                                                          cursor: "pointer",
                                                          padding: "0.25rem",
                                                          display: "flex",
                                                          alignItems: "center",
                                                          justifyContent: "center",
                                                          width: "1.25rem",
                                                          height: "1.25rem"
                                                        }}
                                                        onClick={() => handleProductFieldChange(originalIndex, "productName", "")}
                                                        title="Clear product name"
                                                      >
                                                        <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                      </button>
                                                    )}
                                                  </div>
                                                  <datalist id={`productOptionsInline-${originalIndex}`}>
                                                    {productOptions.map((option, optIndex) => (
                                                      <option value={option} key={optIndex} />
                                                    ))}
                                                  </datalist>
                                                </td>
                                                <td className="text-end" style={{ padding: "0.5rem" }}>
                                                  {fields.showHeight ? (
                                                    <input
                                                      type="number"
                                                      className="form-control form-control-sm text-end"
                                                      value={product.height !== undefined && product.height !== "" ? product.height : ""}
                                                      onChange={(e) => handleProductFieldChange(originalIndex, "height", e.target.value)}
                                                      placeholder="Height"
                                                      step="0.01"
                                                      min="0"
                                                    />
                                                  ) : (
                                                    <span>-</span>
                                                  )}
                                                </td>
                                                <td className="text-end" style={{ padding: "0.5rem" }}>
                                                  {fields.showWidth ? (
                                                    <input
                                                      type="number"
                                                      className="form-control form-control-sm text-end"
                                                      value={product.width !== undefined && product.width !== "" ? product.width : ""}
                                                      onChange={(e) => handleProductFieldChange(originalIndex, "width", e.target.value)}
                                                      placeholder="Width"
                                                      step="0.01"
                                                      min="0"
                                                    />
                                                  ) : (
                                                    <span>-</span>
                                                  )}
                                                </td>
                                                <td style={{ padding: "0.5rem" }}>
                                                  <select
                                                    className="form-control form-control-sm mb-1"
                                                    value={product.curtainType || ""}
                                                    onChange={(e) => {
                                                      const newCurtainType = e.target.value;
                                                      // Update curtain type
                                                      const updatedProducts = [...quotation.products];
                                                      updatedProducts[originalIndex] = { ...updatedProducts[originalIndex], curtainType: newCurtainType };
                                                      
                                                      // Clear blind type when switching away from Blinds
                                                      if (newCurtainType !== "Blinds") {
                                                        updatedProducts[originalIndex].blindType = "";
                                                      }
                                                      
                                                      // Clear company and catalog when switching to Blinds
                                                      if (newCurtainType === "Blinds") {
                                                        updatedProducts[originalIndex].company = "";
                                                        updatedProducts[originalIndex].companyId = "";
                                                        updatedProducts[originalIndex].catalog = "";
                                                        updatedProducts[originalIndex].catalogId = "";
                                                      }
                                                      
                                                      // Recalculate fields if curtain-related fields changed
                                                      if (quotation.quotationType === "curtain") {
                                                        updatedProducts[originalIndex] = recalculateProductFields(updatedProducts[originalIndex]);
                                                      }
                                                      
                                                      setQuotation({ ...quotation, products: updatedProducts });
                                                      
                                                      // Check if this product has been modified
                                                      const originalProduct = originalProducts[originalIndex];
                                                      const currentProduct = updatedProducts[originalIndex];
                                                      const hasChanges = !originalProduct || 
                                                        originalProduct.productName !== currentProduct.productName ||
                                                        originalProduct.place !== currentProduct.place ||
                                                        String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                        String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                        String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                        originalProduct.curtainType !== currentProduct.curtainType ||
                                                        originalProduct.blindType !== currentProduct.blindType ||
                                                        String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                        String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                      
                                                      if (hasChanges) {
                                                        setModifiedProductIndex(originalIndex);
                                                      } else {
                                                        if (modifiedProductIndex === originalIndex) {
                                                          setModifiedProductIndex(null);
                                                        }
                                                      }
                                                    }}
                                                  >
                                                    <option value="">-- Select --</option>
                                                    <option value="AP">AP</option>
                                                    <option value="Roman">Roman</option>
                                                    <option value="Blinds">Blinds</option>
                                                  </select>
                                                  {product.curtainType === "Blinds" && (
                                                    <select
                                                      className="form-control form-control-sm"
                                                      value={product.blindType || ""}
                                                      onChange={(e) => handleProductFieldChange(originalIndex, "blindType", e.target.value)}
                                                    >
                                                      <option value="">-- Select Blind Type --</option>
                                                      <option value="Customised">Customised</option>
                                                      <option value="Fabric Blind">Fabric Blind</option>
                                                      <option value="Eco-Blackout">Eco-Blackout</option>
                                                      <option value="Vertical">Vertical</option>
                                                      <option value="Zebra">Zebra</option>
                                                    </select>
                                                  )}
                                                </td>
                                              </tr>
                                              {/* Company and Catalog Row - Only for curtain quotations, but not for Blinds */}
                                              {quotation.quotationType === "curtain" && product.curtainType !== "Blinds" && (
                                                <tr>
                                                  <td colSpan={5} style={{ padding: "0.5rem" }}>
                                                    <div className="row g-2">
                                                      <div className="col-md-6">
                                                        <label className="form-label fw-semibold mb-1 form-label-responsive">Company</label>
                                                        <div style={{ position: "relative" }}>
                                                          <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            list={`companyOptions-${originalIndex}`}
                                                            value={product.company || ""}
                                                            onChange={(e) => {
                                                              const inputValue = e.target.value;
                                                              // Find the company from companyList by matching the name
                                                              const selectedCompany = companyList.find(c => c.name === inputValue);
                                                              if (selectedCompany) {
                                                                const updatedProducts = [...quotation.products];
                                                                updatedProducts[originalIndex] = {
                                                                  ...updatedProducts[originalIndex],
                                                                  company: selectedCompany.name,
                                                                  companyId: selectedCompany._id,
                                                                  catalog: "",
                                                                  catalogId: ""
                                                                };
                                                                
                                                                // Recalculate fields if curtain-related fields changed
                                                                if (quotation.quotationType === "curtain") {
                                                                  updatedProducts[originalIndex] = recalculateProductFields(updatedProducts[originalIndex]);
                                                                }
                                                                
                                                                setQuotation({ ...quotation, products: updatedProducts });
                                                                
                                                                // Check if this product has been modified
                                                                const originalProduct = originalProducts[originalIndex];
                                                                const currentProduct = updatedProducts[originalIndex];
                                                                const hasChanges = !originalProduct || 
                                                                  originalProduct.productName !== currentProduct.productName ||
                                                                  originalProduct.place !== currentProduct.place ||
                                                                  String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                                  String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                                  String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                                  originalProduct.curtainType !== currentProduct.curtainType ||
                                                                  originalProduct.blindType !== currentProduct.blindType ||
                                                                  String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                                  String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                                
                                                                if (hasChanges) {
                                                                  setModifiedProductIndex(originalIndex);
                                                                } else {
                                                                  if (modifiedProductIndex === originalIndex) {
                                                                    setModifiedProductIndex(null);
                                                                  }
                                                                }
                                                              } else if (inputValue === "") {
                                                                // Clear company and catalog when input is cleared
                                                                const updatedProducts = [...quotation.products];
                                                                updatedProducts[originalIndex] = {
                                                                  ...updatedProducts[originalIndex],
                                                                  company: "",
                                                                  companyId: "",
                                                                  catalog: "",
                                                                  catalogId: ""
                                                                };
                                                                setQuotation({ ...quotation, products: updatedProducts });
                                                                
                                                                // Check if this product has been modified
                                                                const originalProduct = originalProducts[originalIndex];
                                                                const currentProduct = updatedProducts[originalIndex];
                                                                const hasChanges = !originalProduct || 
                                                                  originalProduct.productName !== currentProduct.productName ||
                                                                  originalProduct.place !== currentProduct.place ||
                                                                  String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                                  String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                                  String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                                  originalProduct.curtainType !== currentProduct.curtainType ||
                                                                  originalProduct.blindType !== currentProduct.blindType ||
                                                                  String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                                  String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                                
                                                                if (hasChanges) {
                                                                  setModifiedProductIndex(originalIndex);
                                                                } else {
                                                                  if (modifiedProductIndex === originalIndex) {
                                                                    setModifiedProductIndex(null);
                                                                  }
                                                                }
                                                              } else {
                                                                // Update company name even if not found (for typing)
                                                                handleProductFieldChange(originalIndex, "company", inputValue);
                                                              }
                                                            }}
                                                            placeholder="Type or select company"
                                                            style={{ paddingRight: product.company ? "2rem" : "0.5rem" }}
                                                          />
                                                          {product.company && (
                                                            <button
                                                              type="button"
                                                              className="btn btn-sm p-0"
                                                              style={{
                                                                position: "absolute",
                                                                right: "0.5rem",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "#6c757d",
                                                                cursor: "pointer",
                                                                padding: "0.25rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                width: "1.25rem",
                                                                height: "1.25rem"
                                                              }}
                                                              onClick={() => {
                                                                // Clear company and catalog when clear button is clicked
                                                                const updatedProducts = [...quotation.products];
                                                                updatedProducts[originalIndex] = {
                                                                  ...updatedProducts[originalIndex],
                                                                  company: "",
                                                                  companyId: "",
                                                                  catalog: "",
                                                                  catalogId: ""
                                                                };
                                                                setQuotation({ ...quotation, products: updatedProducts });
                                                                
                                                                // Check if this product has been modified
                                                                const originalProduct = originalProducts[originalIndex];
                                                                const currentProduct = updatedProducts[originalIndex];
                                                                const hasChanges = !originalProduct || 
                                                                  originalProduct.productName !== currentProduct.productName ||
                                                                  originalProduct.place !== currentProduct.place ||
                                                                  String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                                  String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                                  String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                                  originalProduct.curtainType !== currentProduct.curtainType ||
                                                                  originalProduct.blindType !== currentProduct.blindType ||
                                                                  String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                                  String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                                
                                                                if (hasChanges) {
                                                                  setModifiedProductIndex(originalIndex);
                                                                } else {
                                                                  if (modifiedProductIndex === originalIndex) {
                                                                    setModifiedProductIndex(null);
                                                                  }
                                                                }
                                                              }}
                                                              title="Clear company"
                                                            >
                                                              <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                            </button>
                                                          )}
                                                        </div>
                                                        <datalist id={`companyOptions-${originalIndex}`}>
                                                          {companyList && companyList.map((company, compIndex) => (
                                                            <option value={company.name} key={compIndex} />
                                                          ))}
                                                        </datalist>
                                                      </div>
                                                      <div className="col-md-6">
                                                        <label className="form-label fw-semibold mb-1 form-label-responsive">Catalog</label>
                                                        <div style={{ position: "relative" }}>
                                                          <input
                                                            type="text"
                                                            className="form-control form-control-sm"
                                                            list={`catalogOptions-${originalIndex}`}
                                                            value={product.catalog || ""}
                                                            onChange={(e) => {
                                                              const inputValue = e.target.value;
                                                              
                                                              if (inputValue === "") {
                                                                // Clear catalog when input is cleared
                                                                handleCatalogChange(originalIndex, "", "");
                                                                return;
                                                              }
                                                              
                                                              // Try to match catalog immediately
                                                              const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                              
                                                              if (selectedCatalog) {
                                                                // Found a match - update both catalog name and ID together
                                                                const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                                handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                              } else {
                                                                // No immediate match - check if input still matches existing catalog
                                                                const currentProduct = quotation.products[originalIndex];
                                                                let catalogIdToKeep = "";
                                                                
                                                                if (currentProduct && currentProduct.catalogId) {
                                                                  // Check if the existing catalog still matches the input
                                                                  const existingCatalog = productFilteredCatalogs.find(c => c._id === currentProduct.catalogId);
                                                                  if (existingCatalog) {
                                                                    const existingCatalogName = existingCatalog.name || existingCatalog.number || "";
                                                                    // If input matches existing catalog name, keep the catalogId
                                                                    if (findCatalogMatch(inputValue, [existingCatalog])) {
                                                                      catalogIdToKeep = currentProduct.catalogId;
                                                                    }
                                                                  }
                                                                }
                                                                
                                                                // Update display value, preserve catalogId only if it still matches
                                                                handleCatalogChange(originalIndex, inputValue, catalogIdToKeep);
                                                              }
                                                            }}
                                                            onInput={(e) => {
                                                              // onInput fires for every keystroke and datalist selection
                                                              // This ensures we catch datalist selections even if onChange doesn't fire properly
                                                              const inputValue = e.target.value;
                                                              if (inputValue && inputValue.trim() !== "") {
                                                                const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                                if (selectedCatalog) {
                                                                  const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                                  // Only update if catalogId is not already set correctly
                                                                  if (product.catalogId !== selectedCatalog._id) {
                                                                    handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                                  }
                                                                }
                                                              }
                                                            }}
                                                            onBlur={(e) => {
                                                              // On blur, try to match one more time (handles datalist selection)
                                                              const inputValue = e.target.value.trim();
                                                              
                                                              if (inputValue === "") {
                                                                handleCatalogChange(originalIndex, "", "");
                                                                return;
                                                              }
                                                              
                                                              // Try to find match using helper function
                                                              const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                              
                                                              if (selectedCatalog) {
                                                                const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                                handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                              } else {
                                                                // If no match found, clear the ID but keep the display value
                                                                if (product.catalogId) {
                                                                  handleCatalogChange(originalIndex, inputValue, "");
                                                                }
                                                              }
                                                            }}
                                                            placeholder={product.companyId ? "Type or select catalog" : "Select company first"}
                                                            disabled={!product.companyId}
                                                            style={{ paddingRight: product.catalog ? "2rem" : "0.5rem" }}
                                                          />
                                                          {product.catalog && (
                                                            <button
                                                              type="button"
                                                              className="btn btn-sm p-0"
                                                              style={{
                                                                position: "absolute",
                                                                right: "0.5rem",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "#6c757d",
                                                                cursor: "pointer",
                                                                padding: "0.25rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                width: "1.25rem",
                                                                height: "1.25rem"
                                                              }}
                                                              onClick={() => {
                                                                // Clear catalog when clear button is clicked
                                                                handleCatalogChange(originalIndex, "", "");
                                                              }}
                                                              disabled={!product.companyId}
                                                              title="Clear catalog"
                                                            >
                                                              <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                            </button>
                                                          )}
                                                        </div>
                                                        <datalist id={`catalogOptions-${originalIndex}`}>
                                                          {productFilteredCatalogs.map((catalog) => {
                                                            const catalogName = catalog.name || catalog.number || "Unnamed Catalog";
                                                            const displayText = `${catalogName} - Rs. ${Math.round(parseFloat(catalog.priceInRs || 0))} per meter`;
                                                            return (
                                                              <option 
                                                                value={catalogName} 
                                                                key={catalog._id}
                                                              >
                                                                {displayText}
                                                              </option>
                                                            );
                                                          })}
                                                        </datalist>
                                                      </div>
                                                    </div>
                                                  </td>
                                                </tr>
                                              )}
                                              <tr>
                                                <td colSpan={5} className="text-end" style={{ padding: "0.25rem 0.5rem" }}>
                                                  {isModified ? (
                                                    <>
                                                      <button
                                                        type="button"
                                                        className="btn btn-sm btn-success me-2"
                                                        onClick={() => handleSaveProductChanges(originalIndex)}
                                                        title="Save changes"
                                                      >
                                                        <i className="bi bi-check-circle me-1"></i>Save
                                                      </button>
                                                      <button
                                                        type="button"
                                                        className="btn btn-sm btn-warning me-2"
                                                        onClick={() => handleDiscardProductChanges(originalIndex)}
                                                        title="Discard changes"
                                                      >
                                                        <i className="bi bi-x-circle me-1"></i>Discard
                                                      </button>
                                                    </>
                                                  ) : null}
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleRemoveProductClick(originalIndex)}
                                                    disabled={quotation.products.length <= 1}
                                                    title={quotation.products.length <= 1 ? "At least one product is required" : "Delete product"}
                                                  >
                                                    <i className="bi bi-trash me-1"></i>Delete
                                                  </button>
                                                </td>
                                              </tr>
                                            </React.Fragment>
                                          );
                                        })}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            // Separate tables for each place for non-curtain quotations
                            <>
                            {sortedPlaces.map((place, placeIndex) => {
                            const placeProducts = groupedByPlace[place];
                            return (
                              <div key={placeIndex} className="mb-4">
                                <div className="table-responsive">
                                  <table className="table table-bordered table-hover table-sm">
                                    <thead className="table-light">
                                      <tr>
                                        <th style={{ width: "4%", padding: "0.5rem" }}>#</th>
                                        <th style={{ width: "18%", padding: "0.5rem" }}>Product Name</th>
                                        <th style={{ width: "12%", padding: "0.5rem" }}>Place</th>
                                        <th style={{ width: "10%", padding: "0.5rem" }}>Height</th>
                                        <th style={{ width: "10%", padding: "0.5rem" }}>Width</th>
                                        <th style={{ width: "10%", padding: "0.5rem" }}>Length</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr style={{ backgroundColor: "#f8f9fa" }}>
                                        <td colSpan={6} style={{ padding: "0.75rem", fontWeight: "bold", fontSize: "1.1rem", color: "#0d6efd" }}>
                                          Place: {place} ({placeProducts.length})
                                        </td>
                                      </tr>
                                      {placeProducts.map((product, productIndex) => {
                                      const originalIndex = product.originalIndex;
                                      const fields = getProductFields(product.productName);
                                      const isModified = modifiedProductIndex === originalIndex;
                                      // Get filtered catalogs for this product's company
                                      // Handle both user-entered (companyId) and Excel-imported (company field) catalogs
                                      const selectedCompany = product.companyId ? companyList.find(c => String(c._id) === String(product.companyId)) : null;
                                      const companyName = selectedCompany ? selectedCompany.name : product.company;
                                      const productFilteredCatalogs = product.companyId || product.company
                                        ? filterCatalogsByCompany(product.companyId, companyName)
                                        : [];
                                      
                                      return (
                                        <React.Fragment key={originalIndex}>
                                          <tr>
                                            <td className="text-center" style={{ padding: "0.5rem" }}>{productIndex + 1}</td>
                                            <td style={{ padding: "0.5rem" }}>
                                              <div style={{ position: "relative" }}>
                                                <input
                                                  type="text"
                                                  className="form-control form-control-sm"
                                                  list={`productOptionsInline-${originalIndex}`}
                                                  value={product.productName || ""}
                                                  onChange={(e) => handleProductFieldChange(originalIndex, "productName", e.target.value)}
                                                  placeholder="Type or select product"
                                                  style={{ paddingRight: product.productName ? "2rem" : "0.5rem" }}
                                                />
                                                {product.productName && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm p-0"
                                                    style={{
                                                      position: "absolute",
                                                      right: "0.5rem",
                                                      top: "50%",
                                                      transform: "translateY(-50%)",
                                                      background: "transparent",
                                                      border: "none",
                                                      color: "#6c757d",
                                                      cursor: "pointer",
                                                      padding: "0.25rem",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      width: "1.25rem",
                                                      height: "1.25rem"
                                                    }}
                                                    onClick={() => handleProductFieldChange(originalIndex, "productName", "")}
                                                    title="Clear product name"
                                                  >
                                                    <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                  </button>
                                                )}
                                              </div>
                                              <datalist id={`productOptionsInline-${originalIndex}`}>
                                                {productOptions.map((option, optIndex) => (
                                                  <option value={option} key={optIndex} />
                                                ))}
                                              </datalist>
                                            </td>
                                            {quotation.quotationType !== "curtain" && (
                                              <td style={{ padding: "0.5rem" }}>
                                                <select
                                                  className="form-control form-control-sm"
                                                  value={product.place || ""}
                                                  onChange={(e) => handleProductFieldChange(originalIndex, "place", e.target.value)}
                                                >
                                                  <option value="">-- Select Place --</option>
                                                  {placeOptions.map((option, optIndex) => (
                                                    <option value={option} key={optIndex}>
                                                      {option}
                                                    </option>
                                                  ))}
                                                </select>
                                              </td>
                                            )}
                                            <td className="text-end" style={{ padding: "0.5rem" }}>
                                              {fields.showHeight ? (
                                                <input
                                                  type="number"
                                                  className="form-control form-control-sm text-end"
                                                  value={product.height !== undefined && product.height !== "" ? product.height : ""}
                                                  onChange={(e) => handleProductFieldChange(originalIndex, "height", e.target.value)}
                                                  placeholder="Height"
                                                  step="0.01"
                                                  min="0"
                                                />
                                              ) : (
                                                <span>-</span>
                                              )}
                                            </td>
                                            <td className="text-end" style={{ padding: "0.5rem" }}>
                                              {fields.showWidth ? (
                                                <input
                                                  type="number"
                                                  className="form-control form-control-sm text-end"
                                                  value={product.width !== undefined && product.width !== "" ? product.width : ""}
                                                  onChange={(e) => handleProductFieldChange(originalIndex, "width", e.target.value)}
                                                  placeholder="Width"
                                                  step="0.01"
                                                  min="0"
                                                />
                                              ) : (
                                                <span>-</span>
                                              )}
                                            </td>
                                            {quotation.quotationType !== "curtain" && (
                                              <td className="text-end" style={{ padding: "0.5rem" }}>
                                                {fields.showLength ? (
                                                  <input
                                                    type="number"
                                                    className="form-control form-control-sm text-end"
                                                    value={product.length !== undefined && product.length !== "" ? product.length : ""}
                                                    onChange={(e) => handleProductFieldChange(originalIndex, "length", e.target.value)}
                                                    placeholder="Length"
                                                    step="0.01"
                                                    min="0"
                                                  />
                                                ) : (
                                                  <span>-</span>
                                                )}
                                              </td>
                                            )}
                                            {quotation.quotationType === "curtain" && (
                                              <td style={{ padding: "0.5rem" }}>
                                                <select
                                                  className="form-control form-control-sm mb-1"
                                                  value={product.curtainType || ""}
                                                  onChange={(e) => {
                                                    const newCurtainType = e.target.value;
                                                    // Update curtain type
                                                    const updatedProducts = [...quotation.products];
                                                    updatedProducts[originalIndex] = { ...updatedProducts[originalIndex], curtainType: newCurtainType };
                                                    
                                                    // Clear blind type when switching away from Blinds
                                                    if (newCurtainType !== "Blinds") {
                                                      updatedProducts[originalIndex].blindType = "";
                                                    }
                                                    
                                                    // Clear company and catalog when switching to Blinds
                                                    if (newCurtainType === "Blinds") {
                                                      updatedProducts[originalIndex].company = "";
                                                      updatedProducts[originalIndex].companyId = "";
                                                      updatedProducts[originalIndex].catalog = "";
                                                      updatedProducts[originalIndex].catalogId = "";
                                                    }
                                                    
                                                    // Recalculate fields if curtain-related fields changed
                                                    if (quotation.quotationType === "curtain") {
                                                      updatedProducts[originalIndex] = recalculateProductFields(updatedProducts[originalIndex]);
                                                    }
                                                    
                                                    setQuotation({ ...quotation, products: updatedProducts });
                                                    
                                                    // Check if this product has been modified
                                                    const originalProduct = originalProducts[originalIndex];
                                                    const currentProduct = updatedProducts[originalIndex];
                                                    const hasChanges = !originalProduct || 
                                                      originalProduct.productName !== currentProduct.productName ||
                                                      originalProduct.place !== currentProduct.place ||
                                                      String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                      String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                      String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                      originalProduct.curtainType !== currentProduct.curtainType ||
                                                      originalProduct.blindType !== currentProduct.blindType ||
                                                      String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                      String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                    
                                                    if (hasChanges) {
                                                      setModifiedProductIndex(originalIndex);
                                                    } else {
                                                      if (modifiedProductIndex === originalIndex) {
                                                        setModifiedProductIndex(null);
                                                      }
                                                    }
                                                  }}
                                                >
                                                  <option value="">-- Select --</option>
                                                  <option value="AP">AP</option>
                                                  <option value="Roman">Roman</option>
                                                  <option value="Blinds">Blinds</option>
                                                </select>
                                                {product.curtainType === "Blinds" && (
                                                  <select
                                                    className="form-control form-control-sm"
                                                    value={product.blindType || ""}
                                                    onChange={(e) => handleProductFieldChange(originalIndex, "blindType", e.target.value)}
                                                  >
                                                    <option value="">-- Select Blind Type --</option>
                                                    <option value="Customised">Customised</option>
                                                    <option value="Fabric Blind">Fabric Blind</option>
                                                    <option value="Eco-Blackout">Eco-Blackout</option>
                                                    <option value="Vertical">Vertical</option>
                                                    <option value="Zebra">Zebra</option>
                                                  </select>
                                                )}
                                              </td>
                                            )}
                                          </tr>
                                          {/* Company and Catalog Row - Only for curtain quotations, but not for Blinds */}
                                          {quotation.quotationType === "curtain" && product.curtainType !== "Blinds" && (
                                            <tr>
                                              <td colSpan={quotation.quotationType === "curtain" ? 5 : 6} style={{ padding: "0.5rem" }}>
                                                <div className="row g-2">
                                                  <div className="col-md-6">
                                                    <label className="form-label fw-semibold mb-1 form-label-responsive">Company</label>
                                                    <div style={{ position: "relative" }}>
                                                      <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        list={`companyOptions-${originalIndex}`}
                                                        value={product.company || ""}
                                                        onChange={(e) => {
                                                          const inputValue = e.target.value;
                                                          // Find the company from companyList by matching the name
                                                          const selectedCompany = companyList.find(c => c.name === inputValue);
                                                          if (selectedCompany) {
                                                            const updatedProducts = [...quotation.products];
                                                            updatedProducts[originalIndex] = {
                                                              ...updatedProducts[originalIndex],
                                                              company: selectedCompany.name,
                                                              companyId: selectedCompany._id,
                                                              catalog: "",
                                                              catalogId: ""
                                                            };
                                                            
                                                            // Recalculate fields if curtain-related fields changed
                                                            if (quotation.quotationType === "curtain") {
                                                              updatedProducts[originalIndex] = recalculateProductFields(updatedProducts[originalIndex]);
                                                            }
                                                            
                                                            setQuotation({ ...quotation, products: updatedProducts });
                                                            
                                                            // Check if this product has been modified
                                                            const originalProduct = originalProducts[originalIndex];
                                                            const currentProduct = updatedProducts[originalIndex];
                                                            const hasChanges = !originalProduct || 
                                                              originalProduct.productName !== currentProduct.productName ||
                                                              originalProduct.place !== currentProduct.place ||
                                                              String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                              String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                              String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                              originalProduct.curtainType !== currentProduct.curtainType ||
                                                              originalProduct.blindType !== currentProduct.blindType ||
                                                              String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                              String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                            
                                                            if (hasChanges) {
                                                              setModifiedProductIndex(originalIndex);
                                                            } else {
                                                              if (modifiedProductIndex === originalIndex) {
                                                                setModifiedProductIndex(null);
                                                              }
                                                            }
                                                          } else if (inputValue === "") {
                                                            // Clear company and catalog when input is cleared
                                                            const updatedProducts = [...quotation.products];
                                                            updatedProducts[originalIndex] = {
                                                              ...updatedProducts[originalIndex],
                                                              company: "",
                                                              companyId: "",
                                                              catalog: "",
                                                              catalogId: ""
                                                            };
                                                            setQuotation({ ...quotation, products: updatedProducts });
                                                            
                                                            // Check if this product has been modified
                                                            const originalProduct = originalProducts[originalIndex];
                                                            const currentProduct = updatedProducts[originalIndex];
                                                            const hasChanges = !originalProduct || 
                                                              originalProduct.productName !== currentProduct.productName ||
                                                              originalProduct.place !== currentProduct.place ||
                                                              String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                              String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                              String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                              originalProduct.curtainType !== currentProduct.curtainType ||
                                                              originalProduct.blindType !== currentProduct.blindType ||
                                                              String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                              String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                            
                                                            if (hasChanges) {
                                                              setModifiedProductIndex(originalIndex);
                                                            } else {
                                                              if (modifiedProductIndex === originalIndex) {
                                                                setModifiedProductIndex(null);
                                                              }
                                                            }
                                                          } else {
                                                            // Update company name even if not found (for typing)
                                                            handleProductFieldChange(originalIndex, "company", inputValue);
                                                          }
                                                        }}
                                                        placeholder="Type or select company"
                                                        style={{ paddingRight: product.company ? "2rem" : "0.5rem" }}
                                                      />
                                                      {product.company && (
                                                        <button
                                                          type="button"
                                                          className="btn btn-sm p-0"
                                                          style={{
                                                            position: "absolute",
                                                            right: "0.5rem",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#6c757d",
                                                            cursor: "pointer",
                                                            padding: "0.25rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "1.25rem",
                                                            height: "1.25rem"
                                                          }}
                                                          onClick={() => {
                                                            // Clear company and catalog when clear button is clicked
                                                            const updatedProducts = [...quotation.products];
                                                            updatedProducts[originalIndex] = {
                                                              ...updatedProducts[originalIndex],
                                                              company: "",
                                                              companyId: "",
                                                              catalog: "",
                                                              catalogId: ""
                                                            };
                                                            setQuotation({ ...quotation, products: updatedProducts });
                                                            
                                                            // Check if this product has been modified
                                                            const originalProduct = originalProducts[originalIndex];
                                                            const currentProduct = updatedProducts[originalIndex];
                                                            const hasChanges = !originalProduct || 
                                                              originalProduct.productName !== currentProduct.productName ||
                                                              originalProduct.place !== currentProduct.place ||
                                                              String(originalProduct.length || "") !== String(currentProduct.length || "") ||
                                                              String(originalProduct.width || "") !== String(currentProduct.width || "") ||
                                                              String(originalProduct.height || "") !== String(currentProduct.height || "") ||
                                                              originalProduct.curtainType !== currentProduct.curtainType ||
                                                              originalProduct.blindType !== currentProduct.blindType ||
                                                              String(originalProduct.companyId || "") !== String(currentProduct.companyId || "") ||
                                                              String(originalProduct.catalogId || "") !== String(currentProduct.catalogId || "");
                                                            
                                                            if (hasChanges) {
                                                              setModifiedProductIndex(originalIndex);
                                                            } else {
                                                              if (modifiedProductIndex === originalIndex) {
                                                                setModifiedProductIndex(null);
                                                              }
                                                            }
                                                          }}
                                                          title="Clear company"
                                                        >
                                                          <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                        </button>
                                                      )}
                                                    </div>
                                                    <datalist id={`companyOptions-${originalIndex}`}>
                                                      {companyList && companyList.map((company, compIndex) => (
                                                        <option value={company.name} key={compIndex} />
                                                      ))}
                                                    </datalist>
                                                  </div>
                                                  <div className="col-md-6">
                                                    <label className="form-label fw-semibold mb-1 form-label-responsive">Catalog</label>
                                                    <div style={{ position: "relative" }}>
                                                      <input
                                                        type="text"
                                                        className="form-control form-control-sm"
                                                        list={`catalogOptions-${originalIndex}`}
                                                        value={product.catalog || ""}
                                                        onChange={(e) => {
                                                          const inputValue = e.target.value;
                                                          
                                                          if (inputValue === "") {
                                                            // Clear catalog when input is cleared
                                                            handleCatalogChange(originalIndex, "", "");
                                                            return;
                                                          }
                                                          
                                                          // Try to match catalog immediately
                                                          const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                          
                                                          if (selectedCatalog) {
                                                            // Found a match - update both catalog name and ID together
                                                            const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                            handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                          } else {
                                                            // No immediate match - check if input still matches existing catalog
                                                            const currentProduct = quotation.products[originalIndex];
                                                            let catalogIdToKeep = "";
                                                            
                                                            if (currentProduct && currentProduct.catalogId) {
                                                              // Check if the existing catalog still matches the input
                                                              const existingCatalog = productFilteredCatalogs.find(c => c._id === currentProduct.catalogId);
                                                              if (existingCatalog) {
                                                                const existingCatalogName = existingCatalog.name || existingCatalog.number || "";
                                                                // If input matches existing catalog name, keep the catalogId
                                                                if (findCatalogMatch(inputValue, [existingCatalog])) {
                                                                  catalogIdToKeep = currentProduct.catalogId;
                                                                }
                                                              }
                                                            }
                                                            
                                                            // Update display value, preserve catalogId only if it still matches
                                                            handleCatalogChange(originalIndex, inputValue, catalogIdToKeep);
                                                          }
                                                        }}
                                                        onInput={(e) => {
                                                          // onInput fires for every keystroke and datalist selection
                                                          // This ensures we catch datalist selections even if onChange doesn't fire properly
                                                          const inputValue = e.target.value;
                                                          if (inputValue && inputValue.trim() !== "") {
                                                            const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                            if (selectedCatalog) {
                                                              const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                              // Only update if catalogId is not already set correctly
                                                              if (product.catalogId !== selectedCatalog._id) {
                                                                handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                              }
                                                            }
                                                          }
                                                        }}
                                                        onBlur={(e) => {
                                                          // On blur, try to match one more time (handles datalist selection)
                                                          const inputValue = e.target.value.trim();
                                                          
                                                          if (inputValue === "") {
                                                            handleCatalogChange(originalIndex, "", "");
                                                            return;
                                                          }
                                                          
                                                          // Try to find match using helper function
                                                          const selectedCatalog = findCatalogMatch(inputValue, productFilteredCatalogs);
                                                          
                                                          if (selectedCatalog) {
                                                            const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                                                            handleCatalogChange(originalIndex, catalogName, selectedCatalog._id);
                                                          } else {
                                                            // If no match found, clear the ID but keep the display value
                                                            if (product.catalogId) {
                                                              handleCatalogChange(originalIndex, inputValue, "");
                                                            }
                                                          }
                                                        }}
                                                        placeholder={product.companyId ? "Type or select catalog" : "Select company first"}
                                                        disabled={!product.companyId}
                                                        style={{ paddingRight: product.catalog ? "2rem" : "0.5rem" }}
                                                      />
                                                      {product.catalog && (
                                                        <button
                                                          type="button"
                                                          className="btn btn-sm p-0"
                                                          style={{
                                                            position: "absolute",
                                                            right: "0.5rem",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "#6c757d",
                                                            cursor: "pointer",
                                                            padding: "0.25rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "1.25rem",
                                                            height: "1.25rem"
                                                          }}
                                                          onClick={() => {
                                                            // Clear catalog when clear button is clicked
                                                            handleCatalogChange(originalIndex, "", "");
                                                          }}
                                                          disabled={!product.companyId}
                                                          title="Clear catalog"
                                                        >
                                                          <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                                                        </button>
                                                      )}
                                                    </div>
                                                    <datalist id={`catalogOptions-${originalIndex}`}>
                                                      {productFilteredCatalogs.map((catalog) => {
                                                        const catalogName = catalog.name || catalog.number || "Unnamed Catalog";
                                                        const displayText = `${catalogName} - Rs. ${Math.round(parseFloat(catalog.priceInRs || 0))} per meter`;
                                                        return (
                                                          <option 
                                                            value={catalogName} 
                                                            key={catalog._id}
                                                          >
                                                            {displayText}
                                                          </option>
                                                        );
                                                      })}
                                                    </datalist>
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                          <tr>
                                            <td colSpan={quotation.quotationType === "curtain" ? 5 : 6} className="text-end" style={{ padding: "0.25rem 0.5rem" }}>
                                              {isModified ? (
                                                <>
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-success me-2"
                                                    onClick={() => handleSaveProductChanges(originalIndex)}
                                                    title="Save changes"
                                                  >
                                                    <i className="bi bi-check-circle me-1"></i>Save
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm btn-warning me-2"
                                                    onClick={() => handleDiscardProductChanges(originalIndex)}
                                                    title="Discard changes"
                                                  >
                                                    <i className="bi bi-x-circle me-1"></i>Discard
                                                  </button>
                                                </>
                                              ) : null}
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemoveProductClick(originalIndex)}
                                                disabled={quotation.products.length <= 1}
                                                title={quotation.products.length <= 1 ? "At least one product is required" : "Delete product"}
                                              >
                                                <i className="bi bi-trash me-1"></i>Delete
                                              </button>
                                            </td>
                                          </tr>
                                        </React.Fragment>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                        </>
                      )}
                      </div>
                      {/* Add Product Button - Below the table */}
                      {action === "update" && (
                        <div className="mt-3 text-center">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleAddProductClick}
                            title="Add Product"
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <div className="text-center text-muted py-4">
                <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
                <p className="mt-2">No products added yet. Click the <i className="bi bi-plus-circle"></i> button below to add your first product.</p>
                <div className="mt-3">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleAddProductClick}
                    title="Add Product"
                  >
                    <i className="bi bi-plus-circle"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Form Footer */}
          <div className="col-12 mt-4 customer-form-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                {quotation.products && quotation.products.length > 0 ? (
                  <span className="text-success">
                    <i className="bi bi-check-circle me-1"></i>
                    {quotation.products.length} product(s) in this quotation
                  </span>
                ) : (
                  <span className="text-warning">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    No products available
                  </span>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={props.onFormCloseClick}
                >
                  <i className="bi bi-x-circle me-1"></i>Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFormSubmit}
                >
                  <i className="bi bi-check-circle me-1"></i>Update Quotation
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      
      {/* Add Product Modal */}
      {showAddProductModal && (
        <Modal
          heading={modalPlaceName ? `Add New Product - Place: ${modalPlaceName}` : "Add New Product"}
          modalText={
            <div className="container-fluid p-0">
              <div className="row g-3">
                {/* Product Name */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold mb-1">Product Name</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    list="productOptionsModal"
                    value={newProduct.productName || ""}
                    onChange={(e) => handleNewProductChange("productName", e.target.value)}
                    placeholder="Select or type product name"
                  />
                  <datalist id="productOptionsModal">
                    {productOptions.map((option, optIndex) => (
                      <option value={option} key={optIndex} />
                    ))}
                  </datalist>
                  {flagFormInvalid && (!newProduct.productName || newProduct.productName.trim() === "") && (
                    <span className="form-error-message">
                      <i className="bi bi-exclamation-circle"></i>
                      Product name is required
                    </span>
                  )}
                </div>
                
                {/* Place */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold mb-1">Place</label>
                  <select
                    className="form-control form-control-sm"
                    value={newProduct.place || ""}
                    onChange={(e) => handleNewProductChange("place", e.target.value)}
                  >
                    <option value="">-- Select Place --</option>
                    {placeOptions.map((option, optIndex) => (
                      <option value={option} key={optIndex}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {flagFormInvalid && (!newProduct.place || newProduct.place.trim() === "") && (
                    <span className="form-error-message">
                      <i className="bi bi-exclamation-circle"></i>
                      Place is required
                    </span>
                  )}
                </div>
                
                {/* Dynamic fields based on product type */}
                {(() => {
                  const fields = getProductFields(newProduct.productName);
                  return (
                    <>
                      {/* Height */}
                      {fields.showHeight && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold mb-1">{fields.heightLabel} (inches)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={newProduct.height || ""}
                            onChange={(e) => handleNewProductChange("height", e.target.value)}
                            placeholder={`Enter ${fields.heightLabel.toLowerCase()}`}
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                      
                      {/* Width */}
                      {fields.showWidth && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold mb-1">{fields.widthLabel} (inches)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={newProduct.width || ""}
                            onChange={(e) => handleNewProductChange("width", e.target.value)}
                            placeholder={`Enter ${fields.widthLabel.toLowerCase()}`}
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                      
                      {/* Length */}
                      {fields.showLength && (
                        <div className="col-md-4">
                          <label className="form-label fw-semibold mb-1">{fields.lengthLabel} (inches)</label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={newProduct.length || ""}
                            onChange={(e) => handleNewProductChange("length", e.target.value)}
                            placeholder={`Enter ${fields.lengthLabel.toLowerCase()}`}
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                    </>
                  );
                })()}
                
                {/* Curtain Type - Only for curtain quotations */}
                {quotation && quotation.quotationType === "curtain" && (
                  <div className="col-12">
                    <label className="form-label fw-semibold mb-1">Curtain Type</label>
                    <select
                      className="form-control form-control-sm"
                      value={newProduct.curtainType || ""}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newCurtainType = e.target.value;
                        setNewProduct(prev => {
                          const updated = { ...prev, curtainType: newCurtainType };
                          // Clear blind type when switching away from Blinds
                          if (newCurtainType !== "Blinds") {
                            updated.blindType = "";
                          }
                          // Clear company and catalog when switching to Blinds
                          if (newCurtainType === "Blinds") {
                            updated.company = "";
                            updated.companyId = "";
                            updated.catalog = "";
                            updated.catalogId = "";
                            setFilteredCatalogListModal([]);
                          }
                          return updated;
                        });
                      }}
                      style={{ pointerEvents: "auto", zIndex: 1 }}
                    >
                      <option value="">-- Select --</option>
                      <option value="AP">AP</option>
                      <option value="Roman">Roman</option>
                      <option value="Blinds">Blinds</option>
                    </select>
                    
                    {/* Blind Type - Only if Curtain Type is Blinds */}
                    {newProduct.curtainType === "Blinds" && (
                      <select
                        className="form-control form-control-sm mt-2"
                        value={newProduct.blindType || ""}
                        onChange={(e) => handleNewProductChange("blindType", e.target.value)}
                      >
                        <option value="">-- Select Blind Type --</option>
                        <option value="Customised">Customised</option>
                        <option value="Fabric Blind">Fabric Blind</option>
                        <option value="Eco-Blackout">Eco-Blackout</option>
                        <option value="Vertical">Vertical</option>
                        <option value="Zebra">Zebra</option>
                      </select>
                    )}
                  </div>
                )}
                
                {/* Company - Only for curtain quotations, but not for Blinds */}
                {quotation && quotation.quotationType === "curtain" && newProduct.curtainType !== "Blinds" && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold mb-1">Company</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        list={`companyOptionsModal`}
                        value={newProduct.company || ""}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Find the company from companyList by matching the name
                          const selectedCompany = companyList.find(c => c.name === inputValue);
                          if (selectedCompany) {
                            setNewProduct(prev => ({
                              ...prev,
                              company: selectedCompany.name,
                              companyId: selectedCompany._id,
                              catalog: "",
                              catalogId: ""
                            }));
                            // Update filtered catalog list
                            const filtered = filterCatalogsByCompany(selectedCompany._id, selectedCompany.name);
                            setFilteredCatalogListModal(filtered);
                          } else if (inputValue === "") {
                            // Clear company and catalog when input is cleared
                            setNewProduct(prev => ({
                              ...prev,
                              company: "",
                              companyId: "",
                              catalog: "",
                              catalogId: ""
                            }));
                            setFilteredCatalogListModal([]);
                          } else {
                            // Update company name even if not found (for typing)
                            setNewProduct(prev => ({ ...prev, company: inputValue }));
                          }
                        }}
                        onInput={(e) => {
                          // onInput fires for every keystroke and datalist selection
                          const inputValue = e.target.value;
                          if (inputValue && inputValue.trim() !== "") {
                            const selectedCompany = companyList.find(c => c.name === inputValue);
                            if (selectedCompany) {
                              setNewProduct(prev => ({
                                ...prev,
                                company: selectedCompany.name,
                                companyId: selectedCompany._id,
                                catalog: "",
                                catalogId: ""
                              }));
                              const filtered = filterCatalogsByCompany(selectedCompany._id, selectedCompany.name);
                              setFilteredCatalogListModal(filtered);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, try to match one more time (handles datalist selection)
                          const inputValue = e.target.value.trim();
                          if (inputValue === "") {
                            setNewProduct(prev => ({
                              ...prev,
                              company: "",
                              companyId: "",
                              catalog: "",
                              catalogId: ""
                            }));
                            setFilteredCatalogListModal([]);
                            return;
                          }
                          const selectedCompany = companyList.find(c => c.name === inputValue);
                          if (selectedCompany) {
                            setNewProduct(prev => ({
                              ...prev,
                              company: selectedCompany.name,
                              companyId: selectedCompany._id,
                              catalog: "",
                              catalogId: ""
                            }));
                            const filtered = filterCatalogsByCompany(selectedCompany._id, selectedCompany.name);
                            setFilteredCatalogListModal(filtered);
                          } else {
                            // If no match found, clear the ID but keep the display value
                            if (newProduct.companyId) {
                              setNewProduct(prev => ({
                                ...prev,
                                companyId: "",
                                catalog: "",
                                catalogId: ""
                              }));
                              setFilteredCatalogListModal([]);
                            }
                          }
                        }}
                        placeholder="Type or select company"
                        style={{ paddingRight: newProduct.company ? "2rem" : "0.5rem", pointerEvents: "auto", zIndex: 1 }}
                      />
                      {newProduct.company && (
                        <button
                          type="button"
                          className="btn btn-sm p-0"
                          style={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#6c757d",
                            cursor: "pointer",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "1.25rem",
                            height: "1.25rem"
                          }}
                          onClick={() => {
                            handleNewProductChange("company", "");
                            handleNewProductChange("companyId", "");
                            handleNewProductChange("catalog", "");
                            handleNewProductChange("catalogId", "");
                            setFilteredCatalogListModal([]);
                          }}
                          title="Clear company"
                        >
                          <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                        </button>
                      )}
                    </div>
                    <datalist id={`companyOptionsModal`}>
                      {companyList && companyList.map((company, compIndex) => (
                        <option value={company.name} key={compIndex} />
                      ))}
                    </datalist>
                  </div>
                )}
                
                {/* Catalog - Only for curtain quotations, but not for Blinds */}
                {quotation && quotation.quotationType === "curtain" && newProduct.curtainType !== "Blinds" && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold mb-1">Catalog</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        list={`catalogOptionsModal`}
                        value={newProduct.catalog || ""}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          
                          if (inputValue === "") {
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: "",
                              catalogId: ""
                            }));
                            return;
                          }
                          
                          // Try to match catalog immediately
                          const selectedCatalog = findCatalogMatch(inputValue, filteredCatalogListModal);
                          
                          if (selectedCatalog) {
                            const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: catalogName,
                              catalogId: selectedCatalog._id
                            }));
                          } else {
                            // Update display value, preserve catalogId only if it still matches
                            let catalogIdToKeep = "";
                            if (newProduct.catalogId) {
                              const existingCatalog = filteredCatalogListModal.find(c => c._id === newProduct.catalogId);
                              if (existingCatalog) {
                                const existingCatalogName = existingCatalog.name || existingCatalog.number || "";
                                if (findCatalogMatch(inputValue, [existingCatalog])) {
                                  catalogIdToKeep = newProduct.catalogId;
                                }
                              }
                            }
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: inputValue,
                              catalogId: catalogIdToKeep
                            }));
                          }
                        }}
                        onInput={(e) => {
                          // onInput fires for every keystroke and datalist selection
                          const inputValue = e.target.value;
                          if (inputValue && inputValue.trim() !== "") {
                            const selectedCatalog = findCatalogMatch(inputValue, filteredCatalogListModal);
                            if (selectedCatalog) {
                              const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                              // Only update if catalogId is not already set correctly
                              if (newProduct.catalogId !== selectedCatalog._id) {
                                setNewProduct(prev => ({
                                  ...prev,
                                  catalog: catalogName,
                                  catalogId: selectedCatalog._id
                                }));
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // On blur, try to match one more time (handles datalist selection)
                          const inputValue = e.target.value.trim();
                          
                          if (inputValue === "") {
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: "",
                              catalogId: ""
                            }));
                            return;
                          }
                          
                          // Try to find match using helper function
                          const selectedCatalog = findCatalogMatch(inputValue, filteredCatalogListModal);
                          
                          if (selectedCatalog) {
                            const catalogName = selectedCatalog.name || selectedCatalog.number || "";
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: catalogName,
                              catalogId: selectedCatalog._id
                            }));
                          } else {
                            // If no match found, clear the ID but keep the display value
                            if (newProduct.catalogId) {
                              setNewProduct(prev => ({
                                ...prev,
                                catalogId: ""
                              }));
                            }
                          }
                        }}
                        placeholder={newProduct.companyId ? "Type or select catalog" : "Select company first"}
                        disabled={!newProduct.companyId}
                        style={{ paddingRight: newProduct.catalog ? "2rem" : "0.5rem", pointerEvents: "auto", zIndex: 1 }}
                      />
                      {newProduct.catalog && (
                        <button
                          type="button"
                          className="btn btn-sm p-0"
                          style={{
                            position: "absolute",
                            right: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#6c757d",
                            cursor: "pointer",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "1.25rem",
                            height: "1.25rem"
                          }}
                          onClick={() => {
                            setNewProduct(prev => ({
                              ...prev,
                              catalog: "",
                              catalogId: ""
                            }));
                          }}
                          disabled={!newProduct.companyId}
                          title="Clear catalog"
                        >
                          <i className="bi bi-x" style={{ fontSize: "1rem" }}></i>
                        </button>
                      )}
                    </div>
                    <datalist id={`catalogOptionsModal`}>
                      {filteredCatalogListModal.map((catalog) => {
                        const catalogName = catalog.name || catalog.number || "Unnamed Catalog";
                        const displayText = `${catalogName} - Rs. ${Math.round(parseFloat(catalog.priceInRs || 0))} per meter`;
                        return (
                          <option 
                            value={catalogName} 
                            key={catalog._id}
                          >
                            {displayText}
                          </option>
                        );
                      })}
                    </datalist>
                  </div>
                )}
              </div>
            </div>
          }
          btnGroup={["Add Product", "Cancel"]}
          onModalCloseClick={handleCancelAddProduct}
          onModalButtonClick={(ans) => {
            if (ans === "Add Product") {
              handleAddProductFromModal();
            } else {
              handleCancelAddProduct();
            }
          }}
        />
      )}
      
      {/* Product Delete Confirmation Modal */}
      {productToDeleteIndex !== null && (
        <Modal
          heading="Confirm Delete Product"
          modalText={
            `Do you really want to delete product #${productToDeleteIndex + 1} (${quotation.products[productToDeleteIndex]?.productName || 'this product'})? This action cannot be undone.`
          }
          btnGroup={["Yes", "No"]}
          onModalCloseClick={handleCancelProductDelete}
          onModalButtonClick={(ans) => {
            if (ans === "Yes") {
              handleConfirmProductDelete();
            } else {
              handleCancelProductDelete();
            }
          }}
        />
      )}
      
    </div>
  );
});

export default AdminQuotationForm;

