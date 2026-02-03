import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";
import Modal from "./Modal";

const AdminMeasurementForm = forwardRef(function AdminMeasurementForm(props, ref) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [measurement, setMeasurement] = useState("");
  let [errorMeasurement, setErrorMeasurement] = useState(props.measurementValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let [showProductForm, setShowProductForm] = useState(false);
  let [editingProductIndex, setEditingProductIndex] = useState(null);
  let [currentProduct, setCurrentProduct] = useState({ productName: "", length: "", width: "", height: "", place: "", curtainType: "" });
  let [productToDeleteIndex, setProductToDeleteIndex] = useState(null);
  let [originalProducts, setOriginalProducts] = useState([]); // Store original products to detect changes
  let [modifiedProductIndex, setModifiedProductIndex] = useState(null); // Track which product has unsaved changes
  let { emptyMeasurement } = props;
  let { measurementToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  
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
  // Note: Curtains use "height" field (not length), Bed Sheets use "length" field
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
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  
  // Auto-select enquiry when enquiryIdFilter is set and enquiryList is available
  useEffect(() => {
    if (props.action === "add" && props.enquiryIdFilter && props.enquiryList && props.enquiryList.length > 0) {
      // Find the enquiry matching the filter
      const filteredEnquiry = props.enquiryList.find(e => String(e._id) === String(props.enquiryIdFilter));
      if (filteredEnquiry) {
        setMeasurement(prevMeasurement => {
          // Only update if enquiry is not already selected
          if (!prevMeasurement || !prevMeasurement.enquiryId || String(prevMeasurement.enquiryId) !== String(props.enquiryIdFilter)) {
            return {
              ...(prevMeasurement || {}),
              enquiry: filteredEnquiry.displayName || filteredEnquiry.code || "",
              enquiryId: filteredEnquiry._id,
              products: prevMeasurement?.products || []
            };
          }
          return prevMeasurement;
        });
      }
    }
  }, [props.enquiryIdFilter, props.enquiryList, props.action]);
  
  function init() {
    let { action } = props;
    if (action === "add") {
      // Initialize with empty products array
      let measurementToSet = { ...props.emptyMeasurement };
      if (!measurementToSet.products || !Array.isArray(measurementToSet.products)) {
        measurementToSet.products = [];
      }
      // Don't add empty product by default - user will add via form
      if (!measurementToSet.products || !Array.isArray(measurementToSet.products)) {
        measurementToSet.products = [];
      }
      
      // Pre-select enquiry if enquiryIdFilter is provided
      if (props.enquiryIdFilter && props.enquiryList && props.enquiryList.length > 0) {
        const filteredEnquiry = props.enquiryList.find(e => String(e._id) === String(props.enquiryIdFilter));
        if (filteredEnquiry) {
          measurementToSet.enquiry = filteredEnquiry.displayName || filteredEnquiry.code || "";
          measurementToSet.enquiryId = filteredEnquiry._id;
        }
      }
      
      setMeasurement(measurementToSet);
      setOriginalProducts([]); // Initialize original products for add mode
      setModifiedProductIndex(null);
      setShowProductForm(false);
      setEditingProductIndex(null);
      // Don't show positive message until form has been validated
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyMeasurement).filter(
        (key) => !Object.keys(measurementToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        if (key === "products") {
          measurementToBeEdited[key] = [];
        } else {
          measurementToBeEdited[key] = "";
        }
      });
      // Ensure products is an array
      if (!measurementToBeEdited.products || !Array.isArray(measurementToBeEdited.products)) {
        measurementToBeEdited.products = [];
      }
      // If no products, add one empty row
      if (measurementToBeEdited.products.length === 0) {
        measurementToBeEdited.products.push({ productName: "", length: "", width: "", height: "", place: "", curtainType: "" });
      }
      // Ensure all products have length field (for backward compatibility)
      measurementToBeEdited.products.forEach(product => {
        if (!product.hasOwnProperty('length')) {
          product.length = product.height || ""; // Migrate old height to length if needed
        }
      });
      setMeasurement(props.measurementToBeEdited);
      // Store original products for change detection
      setOriginalProducts(JSON.parse(JSON.stringify(props.measurementToBeEdited.products || [])));
      setModifiedProductIndex(null);
      setShowProductForm(false);
      setEditingProductIndex(null);
    }
  }
  
  function handleEnquiryChange(e) {
    const selectedIndex = e.target.selectedIndex;
    const selectedOption = e.target.options[selectedIndex];
    const enquiryId = selectedOption.id;
    const enquiryValue = selectedOption.value;
    
    // If enquiry is changed and we're in "add" mode, check if there's an existing measurement for this enquiry
    if (action === "add" && enquiryId && props.measurementList && props.measurementList.length > 0) {
      // Find existing measurement for this enquiry
      const existingMeasurement = props.measurementList.find(m => m.enquiryId === enquiryId);
      if (existingMeasurement && existingMeasurement.products && existingMeasurement.products.length > 0) {
        // Load products from existing measurement
        setMeasurement({ 
          ...measurement, 
          enquiry: enquiryValue, 
          enquiryId: enquiryId,
          products: [...existingMeasurement.products] // Copy products from existing measurement
        });
      } else {
        // No existing measurement or no products - clear products when switching enquiry
        setMeasurement({ 
          ...measurement, 
          enquiry: enquiryValue, 
          enquiryId: enquiryId,
          products: [] // Clear products when switching to enquiry with no existing measurement
        });
      }
      // Close any open product form when enquiry changes
      setShowProductForm(false);
      setEditingProductIndex(null);
      setProductToDeleteIndex(null);
    } else if (action === "update") {
      // In update mode, just update the enquiry field
      setMeasurement({ ...measurement, enquiry: enquiryValue, enquiryId: enquiryId });
    } else {
      // Fallback - just update enquiry
      setMeasurement({ ...measurement, enquiry: enquiryValue, enquiryId: enquiryId });
    }
    
    let errMeasurement = { ...errorMeasurement };
    errMeasurement.enquiry.message = "";
    setErrorMeasurement(errMeasurement);
  }
  
  function handleAddProductClick() {
    // Check if there's already an incomplete product (missing productName or place)
    if (measurement && measurement.products && measurement.products.length > 0) {
      const lastProduct = measurement.products[measurement.products.length - 1];
      // If last product is incomplete, don't add another one
      if (!lastProduct.productName || !lastProduct.place) {
        return;
      }
    }
    // Get the last place and product name values from existing products, if any
    let lastPlace = "";
    let lastProductName = "";
    if (measurement && measurement.products && measurement.products.length > 0) {
      const lastProduct = measurement.products[measurement.products.length - 1];
      if (lastProduct) {
        if (lastProduct.place) {
          lastPlace = lastProduct.place;
        }
        if (lastProduct.productName) {
          lastProductName = lastProduct.productName;
        }
      }
    }
    // Add new product directly to the table (inline)
    const newProduct = { productName: lastProductName, length: "", width: "", height: "", place: lastPlace, curtainType: "" };
    const updatedProducts = [...(measurement.products || []), newProduct];
    setMeasurement({ ...measurement, products: updatedProducts });
    // Add to original products as well (so it's not marked as modified initially)
    setOriginalProducts([...originalProducts, JSON.parse(JSON.stringify(newProduct))]);
  }
  
  function handleProductFieldChange(index, field, value) {
    const updatedProducts = [...measurement.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    // If product name changes from Curtains to something else, clear curtainType
    if (field === "productName" && value !== "Curtains") {
      updatedProducts[index].curtainType = "";
    }
    // If product name changes to Curtains but curtainType is not set, keep it empty (user will select)
    
    setMeasurement({ ...measurement, products: updatedProducts });
    
    // Check if this product has been modified
    const originalProduct = originalProducts[index];
    const currentProduct = updatedProducts[index];
    const hasChanges = !originalProduct || 
      originalProduct.productName !== currentProduct.productName ||
      originalProduct.place !== currentProduct.place ||
      String(originalProduct.length || "") !== String(currentProduct.length || "") ||
      String(originalProduct.width || "") !== String(currentProduct.width || "") ||
      String(originalProduct.height || "") !== String(currentProduct.height || "") ||
      String(originalProduct.curtainType || "") !== String(currentProduct.curtainType || "");
    
    if (hasChanges) {
      setModifiedProductIndex(index);
    } else {
      // If reverted to original, clear modification flag
      if (modifiedProductIndex === index) {
        setModifiedProductIndex(null);
      }
    }
    
    // Removed auto-add logic - new product row will only be added when save button is clicked
  }
  
  function handleSaveProductChanges(index) {
    // Update original products to reflect saved changes
    const updatedOriginalProducts = [...originalProducts];
    updatedOriginalProducts[index] = JSON.parse(JSON.stringify(measurement.products[index]));
    setOriginalProducts(updatedOriginalProducts);
    setModifiedProductIndex(null);
    // Removed auto-add logic - user must click + button to add next product
  }
  
  function handleDiscardProductChanges(index) {
    // Revert to original product
    const updatedProducts = [...measurement.products];
    updatedProducts[index] = JSON.parse(JSON.stringify(originalProducts[index]));
    setMeasurement({ ...measurement, products: updatedProducts });
    setModifiedProductIndex(null);
  }
  
  function handleSaveProduct() {
    // Validate current product
    if (!currentProduct.productName || currentProduct.productName.trim() === "") {
      setFlagFormInvalid(true);
      return;
    }
    
    const fields = getProductFields(currentProduct.productName);
    if (!currentProduct.place || currentProduct.place.trim() === "") {
      setFlagFormInvalid(true);
      return;
    }
    
    let hasErrors = false;
    if (fields.showLength && (!currentProduct.length || isNaN(parseFloat(currentProduct.length)))) {
      hasErrors = true;
    }
    if (fields.showWidth && (!currentProduct.width || isNaN(parseFloat(currentProduct.width)))) {
      hasErrors = true;
    }
    if (fields.showHeight && (!currentProduct.height || isNaN(parseFloat(currentProduct.height)))) {
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFlagFormInvalid(true);
      return;
    }
    
    // Save product (only for new products)
    const updatedProducts = [...measurement.products];
    // Add new product
    updatedProducts.push({ ...currentProduct });
    setMeasurement({ ...measurement, products: updatedProducts });
    // Update original products to include the new product
    setOriginalProducts([...originalProducts, JSON.parse(JSON.stringify(currentProduct))]);
    
    // Keep form open and pre-fill with last used values for next product
    const savedProductName = currentProduct.productName || "";
    const savedPlace = currentProduct.place || "";
    const savedCurtainType = currentProduct.curtainType || "";
    setCurrentProduct({ productName: savedProductName, length: "", width: "", height: "", place: savedPlace, curtainType: savedCurtainType });
    setEditingProductIndex(null);
    setFlagFormInvalid(false);
    // Form stays open (setShowProductForm remains true)
  }
  
  function handleCancelProductForm() {
    setShowProductForm(false);
    setEditingProductIndex(null);
    setCurrentProduct({ productName: "", length: "", width: "", height: "", place: "", curtainType: "" });
    setFlagFormInvalid(false);
  }
  
  function handleRemoveProductClick(index) {
    setProductToDeleteIndex(index);
  }
  
  function handleCancelProductDelete() {
    setProductToDeleteIndex(null);
  }
  
  function handleConfirmProductDelete() {
    if (productToDeleteIndex !== null && measurement.products.length > 1) {
      const updatedProducts = measurement.products.filter((_, i) => i !== productToDeleteIndex);
      setMeasurement({ ...measurement, products: updatedProducts });
      setProductToDeleteIndex(null);
    }
  }
  
  function handleCurrentProductChange(field, value) {
    const updatedProduct = { ...currentProduct, [field]: value };
    
    // If product name changes from Curtains to something else, clear curtainType
    if (field === "productName" && value !== "Curtains") {
      updatedProduct.curtainType = "";
    }
    // If product name changes to Curtains but curtainType is not set, keep it empty (user will select)
    
    setCurrentProduct(updatedProduct);
  }
  
  function validateProduct(product, index) {
    const errors = {};
    if (!product.productName || product.productName.trim() === "") {
      errors.productName = "Product name is required";
      return errors; // Return early if no product selected
    }
    
    if (!product.place || product.place.trim() === "") {
      errors.place = "Place is required";
    }
    
    const fields = getProductFields(product.productName);
    
    if (fields.showLength) {
      if (!product.length || product.length === "" || isNaN(parseFloat(product.length))) {
        errors.length = `Valid ${fields.lengthLabel.toLowerCase()} is required`;
      } else if (parseFloat(product.length) < 0) {
        errors.length = `${fields.lengthLabel} cannot be negative`;
      }
    }
    
    if (fields.showWidth) {
      if (!product.width || product.width === "" || isNaN(parseFloat(product.width))) {
        errors.width = `Valid ${fields.widthLabel.toLowerCase()} is required`;
      } else if (parseFloat(product.width) < 0) {
        errors.width = `${fields.widthLabel} cannot be negative`;
      }
    }
    
    if (fields.showHeight) {
      if (!product.height || product.height === "" || isNaN(parseFloat(product.height))) {
        errors.height = `Valid ${fields.heightLabel.toLowerCase()} is required`;
      } else if (parseFloat(product.height) < 0) {
        errors.height = `${fields.heightLabel} cannot be negative`;
      }
    }
    
    return errors;
  }
  
  function checkAllErrors() {
    // Check enquiry
    if (!measurement.enquiryId || measurement.enquiryId === "") {
      let errMeasurement = { ...errorMeasurement };
      errMeasurement.enquiry.message = "Enquiry is required";
      setErrorMeasurement(errMeasurement);
      return true;
    }
    
    // Check products
    if (!measurement.products || measurement.products.length === 0) {
      setFlagFormInvalid(true);
      return true;
    }
    
    // If product form is open, don't submit main form
    if (showProductForm) {
      return true;
    }
    
    return false;
  }
  
  const formRef = useRef(null);
  
  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setHasValidated(true);
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    
    // Convert dimensions to numbers for each product
    let measurementToSubmit = {
      ...measurement,
      products: measurement.products.map(product => ({
        productName: product.productName,
        place: product.place,
        length: product.length ? parseFloat(product.length) : (product.length === "" ? "" : 0),
        width: product.width ? parseFloat(product.width) : (product.width === "" ? "" : 0),
        height: product.height ? parseFloat(product.height) : (product.height === "" ? "" : 0),
        curtainType: product.curtainType || ""
      }))
    };
    props.onFormSubmit(measurementToSubmit);
  };
  
  useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        handleFormSubmit({ preventDefault: () => {} });
      }
    }
  }));
  
  return (
    <div className="customer-form-wrapper my-3">
      <form ref={formRef} className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new measurement" : "Update measurement"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Record product measurements and dimensions for accurate order processing.
            </p>
          </div>
          
          {/* Enquiry Select */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Enquiry</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-clipboard-check"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="enquiry"
                  value={measurement.enquiry || ""}
                  onChange={handleEnquiryChange}
                >
                  <option value="">-- Select Enquiry --</option>
                  {props.enquiryList && props.enquiryList.map((enquiry, index) => (
                    <option value={enquiry.displayName} key={index} id={enquiry._id}>
                      {enquiry.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="">
              {errorMeasurement.enquiry?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorMeasurement.enquiry.message}
                </span>
              ) : null}
            </div>
          </div>
          
          {/* Products Section */}
          <div className="col-12 my-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Products</h5>
            </div>
            
            {/* Product Form for Add/Edit */}
            {showProductForm && (
              <div className="card mb-2" style={{ border: "2px solid #0d6efd", borderRadius: "0.5rem" }}>
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
                  <span className="fw-semibold" style={{ fontSize: "0.95rem" }}>
                    {editingProductIndex !== null ? `Edit Product #${editingProductIndex + 1}` : "Add New Product"}
                  </span>
                </div>
                <div className="card-body py-2">
                  {/* Desktop View: Single Row */}
                  <div className="row g-2 d-none d-md-block">
                    {/* Place */}
                    <div className="col-md-2">
                      <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Place</label>
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
                    
                    {/* Product Name */}
                    <div className="col-md-2">
                      <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Product Name</label>
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
                          <option value={option} key={optIndex}>
                            {option}
                          </option>
                        ))}
                      </datalist>
                      {flagFormInvalid && (!currentProduct.productName || currentProduct.productName.trim() === "") && (
                        <span className="form-error-message">
                          <i className="bi bi-exclamation-circle"></i>
                          Product name is required
                        </span>
                      )}
                    </div>
                    
                    {/* Height */}
                    {(() => {
                      const fields = getProductFields(currentProduct.productName);
                      return (
                        <>
                          {fields.showHeight && (
                            <div className="col-md-2">
                              <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.heightLabel} (inches)</label>
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
                            <div className="col-md-2">
                              <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.widthLabel} (inches)</label>
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
                            <div className="col-md-2">
                              <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.lengthLabel} (inches)</label>
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
                    
                    {/* Curtain Type - Only show for Curtains */}
                    {currentProduct.productName === "Curtains" && (
                      <div className="col-md-2">
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Curtain Type</label>
                        <select
                          className="form-control form-control-sm"
                          value={currentProduct.curtainType || ""}
                          onChange={(e) => handleCurrentProductChange("curtainType", e.target.value)}
                        >
                          <option value="">-- Select Curtain Type --</option>
                          <option value="AP">AP</option>
                          <option value="Roman">Roman</option>
                          <option value="Blinds">Blinds</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {/* Mobile View: Two Rows */}
                  <div className="d-block d-md-none">
                    {/* First Row: Place and Product Name */}
                    <div className="row g-2 mb-2">
                      {/* Place */}
                      <div className="col-6">
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Place</label>
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
                      
                      {/* Product Name */}
                      <div className="col-6">
                        <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Product Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          list="productOptionsMobile"
                          value={currentProduct.productName || ""}
                          onChange={(e) => handleCurrentProductChange("productName", e.target.value)}
                          placeholder="Select or type product name"
                        />
                        <datalist id="productOptionsMobile">
                          {productOptions.map((option, optIndex) => (
                            <option value={option} key={optIndex}>
                              {option}
                            </option>
                          ))}
                        </datalist>
                        {flagFormInvalid && (!currentProduct.productName || currentProduct.productName.trim() === "") && (
                          <span className="form-error-message">
                            <i className="bi bi-exclamation-circle"></i>
                            Product name is required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Second Row: Other Fields */}
                    <div className="row g-2">
                      {/* Height */}
                      {(() => {
                        const fields = getProductFields(currentProduct.productName);
                        return (
                          <>
                            {fields.showHeight && (
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.heightLabel} (inches)</label>
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
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.widthLabel} (inches)</label>
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
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.lengthLabel} (inches)</label>
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
                      
                      {/* Curtain Type - Only show for Curtains */}
                      {currentProduct.productName === "Curtains" && (
                        <div className="col-6">
                          <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Curtain Type</label>
                          <select
                            className="form-control form-control-sm"
                            value={currentProduct.curtainType || ""}
                            onChange={(e) => handleCurrentProductChange("curtainType", e.target.value)}
                          >
                            <option value="">-- Select Curtain Type --</option>
                            <option value="AP">AP</option>
                            <option value="Roman">Roman</option>
                            <option value="Blinds">Blinds</option>
                          </select>
                        </div>
                      )}
                    </div>
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
            
            {/* Products Table - Desktop View */}
            {measurement.products && measurement.products.length > 0 && (
              <>
                {/* Desktop Table View */}
                <div className="table-responsive d-none d-md-block">
                  {(() => {
                    // Check if any product needs length field
                    const needsLength = measurement.products.some(p => {
                      const fields = getProductFields(p.productName);
                      return fields.showLength;
                    });
                    // Check if any product needs height field
                    const needsHeight = measurement.products.some(p => {
                      const fields = getProductFields(p.productName);
                      return fields.showHeight;
                    });
                    // Check if any product is Curtains (needs curtainType)
                    const hasCurtains = measurement.products.some(p => p.productName === "Curtains");
                    
                    return (
                      <table className="table table-bordered table-hover table-sm">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: "4%", padding: "0.5rem" }}>#</th>
                            <th style={{ width: "16%", padding: "0.5rem" }}>Place</th>
                            <th style={{ width: "18%", padding: "0.5rem" }}>Product Name</th>
                            {needsHeight && <th style={{ width: "14%", padding: "0.5rem" }}>Height</th>}
                            <th style={{ width: "14%", padding: "0.5rem" }}>Width</th>
                            {needsLength && <th style={{ width: "16%", padding: "0.5rem" }}>Length</th>}
                            {hasCurtains && <th style={{ width: "18%", padding: "0.5rem" }}>Curtain Type</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {measurement.products.map((product, index) => {
                            const fields = getProductFields(product.productName);
                            const isModified = modifiedProductIndex === index;
                            const colSpan = 3 + (needsHeight ? 1 : 0) + 1 + (needsLength ? 1 : 0) + (hasCurtains ? 1 : 0);
                            return (
                              <React.Fragment key={index}>
                                <tr>
                                  <td className="text-center" style={{ padding: "0.5rem" }}>{index + 1}</td>
                                  <td style={{ padding: "0.5rem" }}>
                                    <select
                                      className="form-control form-control-sm"
                                      value={product.place || ""}
                                      onChange={(e) => handleProductFieldChange(index, "place", e.target.value)}
                                    >
                                      <option value="">-- Select Place --</option>
                                      {placeOptions.map((option, optIndex) => (
                                        <option value={option} key={optIndex}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td style={{ padding: "0.5rem" }}>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      list={`productOptionsInline-${index}`}
                                      value={product.productName || ""}
                                      onChange={(e) => handleProductFieldChange(index, "productName", e.target.value)}
                                      placeholder="Type or select product"
                                    />
                                    <datalist id={`productOptionsInline-${index}`}>
                                      {productOptions.map((option, optIndex) => (
                                        <option value={option} key={optIndex}>
                                          {option}
                                        </option>
                                      ))}
                                    </datalist>
                                  </td>
                                  {needsHeight && (
                                    <td className="text-end" style={{ padding: "0.5rem" }}>
                                      {fields.showHeight ? (
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-end"
                                          value={product.height !== undefined && product.height !== "" ? product.height : ""}
                                          onChange={(e) => handleProductFieldChange(index, "height", e.target.value)}
                                          placeholder="Height"
                                          step="0.01"
                                          min="0"
                                        />
                                      ) : (
                                        <span>-</span>
                                      )}
                                    </td>
                                  )}
                                  <td className="text-end" style={{ padding: "0.5rem" }}>
                                    {fields.showWidth ? (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        value={product.width !== undefined && product.width !== "" ? product.width : ""}
                                        onChange={(e) => handleProductFieldChange(index, "width", e.target.value)}
                                        placeholder="Width"
                                        step="0.01"
                                        min="0"
                                      />
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </td>
                                  {needsLength && (
                                    <td className="text-end" style={{ padding: "0.5rem" }}>
                                      {fields.showLength ? (
                                        <input
                                          type="number"
                                          className="form-control form-control-sm text-end"
                                          value={product.length !== undefined && product.length !== "" ? product.length : ""}
                                          onChange={(e) => handleProductFieldChange(index, "length", e.target.value)}
                                          placeholder="Length"
                                          step="0.01"
                                          min="0"
                                        />
                                      ) : (
                                        <span>-</span>
                                      )}
                                    </td>
                                  )}
                                  {hasCurtains && (
                                    <td style={{ padding: "0.5rem" }}>
                                      {product.productName === "Curtains" ? (
                                        <select
                                          className="form-control form-control-sm"
                                          value={product.curtainType || ""}
                                          onChange={(e) => handleProductFieldChange(index, "curtainType", e.target.value)}
                                        >
                                          <option value="">-- Select --</option>
                                          <option value="AP">AP</option>
                                          <option value="Roman">Roman</option>
                                          <option value="Blinds">Blinds</option>
                                        </select>
                                      ) : (
                                        <span className="text-muted">-</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                                <tr>
                                  <td colSpan={colSpan} className="text-end" style={{ padding: "0.25rem 0.5rem" }}>
                                {isModified ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-success me-2"
                                      onClick={() => handleSaveProductChanges(index)}
                                      title="Save changes"
                                    >
                                      <i className="bi bi-check-circle me-1"></i>Save
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-warning me-2"
                                      onClick={() => handleDiscardProductChanges(index)}
                                      title="Discard changes"
                                    >
                                      <i className="bi bi-x-circle me-1"></i>Discard
                                    </button>
                                  </>
                                ) : null}
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveProductClick(index)}
                                  disabled={measurement.products.length <= 1}
                                  title={measurement.products.length <= 1 ? "At least one product is required" : "Delete product"}
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
                    );
                  })()}
                </div>
                
                {/* Mobile Card View */}
                <div className="d-block d-md-none">
                  {measurement.products.map((product, index) => {
                    const fields = getProductFields(product.productName);
                    const isModified = modifiedProductIndex === index;
                    return (
                      <div key={index} className="card mb-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Product #{index + 1}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveProductClick(index)}
                            disabled={measurement.products.length <= 1}
                            title={measurement.products.length <= 1 ? "At least one product is required" : "Delete product"}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="card-body">
                          {/* First Row: Place and Product Name */}
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Place</label>
                              <select
                                className="form-control form-control-sm"
                                value={product.place || ""}
                                onChange={(e) => handleProductFieldChange(index, "place", e.target.value)}
                              >
                                <option value="">-- Select Place --</option>
                                {placeOptions.map((option, optIndex) => (
                                  <option value={option} key={optIndex}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Product Name</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                list={`productOptionsMobileCard-${index}`}
                                value={product.productName || ""}
                                onChange={(e) => handleProductFieldChange(index, "productName", e.target.value)}
                                placeholder="Type or select product"
                              />
                              <datalist id={`productOptionsMobileCard-${index}`}>
                                {productOptions.map((option, optIndex) => (
                                  <option value={option} key={optIndex}>
                                    {option}
                                  </option>
                                ))}
                              </datalist>
                            </div>
                          </div>
                          
                          {/* Second Row: Height, Width, Curtain Type */}
                          <div className="row g-2 mb-2">
                            {fields.showHeight && (
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.heightLabel}</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={product.height !== undefined && product.height !== "" ? product.height : ""}
                                  onChange={(e) => handleProductFieldChange(index, "height", e.target.value)}
                                  placeholder={fields.heightLabel}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            )}
                            {fields.showWidth && (
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.widthLabel}</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={product.width !== undefined && product.width !== "" ? product.width : ""}
                                  onChange={(e) => handleProductFieldChange(index, "width", e.target.value)}
                                  placeholder={fields.widthLabel}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            )}
                            {product.productName === "Curtains" && (
                              <div className="col-4">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>Curtain Type</label>
                                <select
                                  className="form-control form-control-sm"
                                  value={product.curtainType || ""}
                                  onChange={(e) => handleProductFieldChange(index, "curtainType", e.target.value)}
                                >
                                  <option value="">-- Select --</option>
                                  <option value="AP">AP</option>
                                  <option value="Roman">Roman</option>
                                  <option value="Blinds">Blinds</option>
                                </select>
                              </div>
                            )}
                          </div>
                          
                          {/* Third Row: Length (if needed) */}
                          {fields.showLength && (
                            <div className="row g-2">
                              <div className="col-12">
                                <label className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>{fields.lengthLabel}</label>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={product.length !== undefined && product.length !== "" ? product.length : ""}
                                  onChange={(e) => handleProductFieldChange(index, "length", e.target.value)}
                                  placeholder={fields.lengthLabel}
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          {isModified && (
                            <div className="mt-2 text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleSaveProductChanges(index)}
                                title="Save changes"
                              >
                                <i className="bi bi-check-circle me-1"></i>Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-warning"
                                onClick={() => handleDiscardProductChanges(index)}
                                title="Discard changes"
                              >
                                <i className="bi bi-x-circle me-1"></i>Discard
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Add Product Button - Below the table */}
                {!showProductForm && measurement.enquiryId && measurement.enquiryId !== "" && (
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
            )}
            
            {(!measurement.products || measurement.products.length === 0) && !showProductForm && (
              <div className="alert alert-info mt-2">
                <small>No products added yet. Click the <i className="bi bi-plus-circle"></i> button below to add your first product.</small>
              </div>
            )}
            
            {/* Add Product Button - When no products exist */}
            {(!measurement.products || measurement.products.length === 0) && !showProductForm && measurement.enquiryId && measurement.enquiryId !== "" && (
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
            
            {flagFormInvalid && (!measurement.products || measurement.products.length === 0) && !showProductForm && (
              <div className="alert alert-danger mt-2">
                <small>At least one product is required</small>
              </div>
            )}
          </div>
          
          <div className="col-12 mt-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center customer-form-actions">
            <div className="small text-muted mb-2 mb-md-0">
              {!hasValidated
                ? ""
                : flagFormInvalid
                ? "Please fix the highlighted fields."
                : "All fields look good. You can save now."}
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={props.onFormCloseClick}
              >
                Cancel
              </button>
              <button
                className="btn btn-darkcolor px-4"
                type="submit"
              >
                {(action + " " + selectedEntity.singularName).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Product Delete Confirmation Modal */}
      {productToDeleteIndex !== null && (
        <Modal
          heading="Confirm Delete Product"
          modalText={
            `Do you really want to delete product #${productToDeleteIndex + 1} (${measurement.products[productToDeleteIndex]?.productName || 'this product'})? This action cannot be undone.`
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

export default AdminMeasurementForm;
