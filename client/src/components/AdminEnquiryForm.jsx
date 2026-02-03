import { useEffect, useState } from "react";
// import { fieldValidate } from "../external/vite-sdk";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
// import { SingleFileUpload } from "../external/vite-sdk";
import formLayout from "./FormLayout";
export default function AdminEnquiryForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [enquiry, setEnquiry] = useState("");
  let [errorEnquiry, setErrorEnquiry] = useState(props.enquiryValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyEnquiry } = props;
  let { enquiryToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { enquirySchema } = props;
  let { enquiryList } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromEnquirySchema()
  );
  function getSingleFileListFromEnquirySchema() {
    let list = [];
    enquirySchema.forEach((e, index) => {
      let obj = {};
      if (e.type == "singleFile") {
        obj["fileAttributeName"] = e.attribute;
        obj["allowedFileType"] = e.allowedFileType;
        obj["allowedSize"] = e.allowedSize;
        list.push(obj);
      }
    });
    return list;
  }
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  
  // Re-initialize customer selection when customerList or customerIdFilter becomes available (for quick mode)
  useEffect(() => {
    if (action === "add" && props.customerIdFilter && props.customerList && props.customerList.length > 0 && enquiry) {
      const customer = props.customerList.find(c => String(c._id) === String(props.customerIdFilter));
      if (customer && (!enquiry.customerId || String(enquiry.customerId) !== String(props.customerIdFilter))) {
        const displayName = customer.whatsappNumber 
          ? `${customer.name} (${customer.whatsappNumber})`
          : customer.name;
        setEnquiry(prevEnquiry => ({ ...prevEnquiry, customer: displayName, customerId: customer._id }));
      }
    }
  }, [props.customerList, props.customerIdFilter, action]);
  function generateEnquiryCode() {
    if (!enquiryList || enquiryList.length === 0) {
      const now = new Date();
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const month = monthNames[now.getMonth()];
      const year = now.getFullYear();
      return `${month}${year}-1`;
    }
    
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
  
  function init() {
    let { action } = props;
    if (action === "add") {
      // Generate code if not already set or if enquiryList has changed
      let enquiryToSet = { ...props.emptyEnquiry };
      if (!enquiryToSet.code || enquiryToSet.code.trim() === '') {
        enquiryToSet.code = generateEnquiryCode();
      }
      // Set default status to "in-process" for new enquiries
      if (!enquiryToSet.status) {
        enquiryToSet.status = "in-process";
      }
      
      // Pre-select customer if in quick mode (customerIdFilter is provided)
      if (props.customerIdFilter && props.customerList && props.customerList.length > 0) {
        const customer = props.customerList.find(c => String(c._id) === String(props.customerIdFilter));
        if (customer) {
          const displayName = customer.whatsappNumber 
            ? `${customer.name} (${customer.whatsappNumber})`
            : customer.name;
          enquiryToSet.customer = displayName;
          enquiryToSet.customerId = customer._id;
        }
      }
      
      setEnquiry(enquiryToSet);
      // Don't show positive message until form has been validated
      setHasValidated(false);
    } else if (action === "update") {
      // in edit mode, keep the update button enabled at the beginning
      setFlagFormInvalid(false);
      // find missing keys
      const missing = Object.keys(emptyEnquiry).filter(
        (key) => !Object.keys(enquiryToBeEdited).includes(key)
      );
      // add them to objB with empty string
      missing.forEach((key) => {
        enquiryToBeEdited[key] = "";
      });
      // Keep existing status or set to empty if not set
      if (!enquiryToBeEdited.status) {
        enquiryToBeEdited.status = "";
      }
      setEnquiry(props.enquiryToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setEnquiry({ ...enquiry, [name]: event.target.value });
    // Skip length validation for customer field (it's a relational field with formatted names)
    if (name === "customer") {
      // Only check if field is required (empty), skip length validation
      const value = event.target.value.trim();
      if (value.length === 0 && errorEnquiry.customer.mnLen > 0) {
        let errEnquiry = { ...errorEnquiry };
        errEnquiry.customer.message = "customer is required";
        setErrorEnquiry(errEnquiry);
      } else {
        // Clear any existing error
        let errEnquiry = { ...errorEnquiry };
        errEnquiry.customer.message = "";
        setErrorEnquiry(errEnquiry);
      }
      return;
    }
    let message = fieldValidate(event, errorEnquiry);
    let errEnquiry = { ...errorEnquiry };
    errorEnquiry[`${name}`].message = message;
    setErrorEnquiry(errEnquiry);
  }
  function handleBlur(event) {
    let name = event.target.name;
    // Skip validation for customer field in update mode (it's read-only)
    if (name === "customer" && action === "update") {
      return;
    }
    // Skip length validation for customer field (it's a relational field with formatted names)
    if (name === "customer") {
      // Only check if field is required (empty), skip length validation
      const value = event.target.value.trim();
      if (value.length === 0 && errorEnquiry.customer.mnLen > 0) {
        let errEnquiry = { ...errorEnquiry };
        errEnquiry.customer.message = "customer is required";
        setErrorEnquiry(errEnquiry);
      } else {
        // Clear any existing error
        let errEnquiry = { ...errorEnquiry };
        errEnquiry.customer.message = "";
        setErrorEnquiry(errEnquiry);
      }
      return;
    }
    let message = fieldValidate(event, errorEnquiry);
    let errEnquiry = { ...errorEnquiry };
    errorEnquiry[`${name}`].message = message;
    setErrorEnquiry(errEnquiry);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function handleRadioFieldChange(event) {
    let name = event.target.name;
    setEnquiry({ ...enquiry, [name]: event.target.value });
  }
  function handleCheckBoxChange(event) {
    const { name, value, checked } = event.target;
    if (checked) {
      // Add value to array for that name
      setEnquiry({ ...enquiry, [name]: [...enquiry[`${name}`], value] });
    } else {
      // Remove value from array for that name
      setEnquiry({
        ...enquiry,
        [name]: enquiry[`${name}`].filter((e) => e !== value),
      });
    }
  }
  function checkAllErrors() {
    for (let field in errorEnquiry) {
      if (errorEnquiry[field].message !== "") {
        return true;
      } //if
    } //for
    let errEnquiry = { ...errorEnquiry };
    let flag = false;
    for (let field in enquiry) {
      // Skip code validation - it's auto-generated
      if (field === "code") {
        continue;
      }
      // Skip status validation - it has a default value and is always set
      if (field === "status") {
        continue;
      }
      // Skip customer validation in update mode - it's read-only
      if (field === "customer" && action === "update") {
        continue;
      }
      if (errorEnquiry[field] && enquiry[field] == "") {
        flag = true;
        errEnquiry[field].message = "Required...";
      } //if
    } //for
    if (flag) {
      setErrorEnquiry(errEnquiry);
      return true;
    }
    return false;
  }
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setHasValidated(true);
    // for dropdown, data is to be modified
    // first check whether all entries are valid or not
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    if (action == "update") {
      // There might be files in this form, add those also
      let pr = { ...enquiry };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          // image is modified
          // if field-name is image, temporarily in "imageNew" field, new file-name is saved.
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      } //for
      setEnquiry(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(enquiry);
    }
  };
  function handleFileChange(selectedFile, fileIndex, message) {
    setFlagFormInvalid(false);
    if (action == "add") {
      // add datesuffix to file-name
      const timestamp = Date.now();
      const ext = selectedFile.name.split(".").pop();
      const base = selectedFile.name.replace(/\.[^/.]+$/, "");
      const newName = `${base}-${timestamp}.${ext}`;
      // Create a new File object with the new name
      const renamedFile = new File([selectedFile], newName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      });
      setEnquiry({
        ...enquiry,
        ["file" + fileIndex]: renamedFile,
        [singleFileList[fileIndex].fileAttributeName]: newName,
      });
      let errEnquiry = { ...errorEnquiry };
      errEnquiry[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorEnquiry(errEnquiry);
      // setErrorEnquiry({ ...errorEnquiry, message: message });
    }
  }
  function handleFileRemove(selectedFile, fileIndex, message) {
    if (action == "add") {
      setFlagFormInvalid(false);
      setEnquiry({
        ...enquiry,
        [singleFileList[fileIndex].fileAttributeName]: "",
      });
      let errEnquiry = { ...errorEnquiry };
      errEnquiry[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorEnquiry(errEnquiry);
    } else if (action == "update") {
      let newFileName = "";
      if (selectedFile) {
        newFileName = selectedFile.name;
      } else {
        // user selected a new file but then deselected
        newFileName = "";
      }
      setEnquiry({
        ...enquiry,
        ["file" + fileIndex]: selectedFile,
        [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      });
      let errEnquiry = { ...errorEnquiry };
      errEnquiry[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorEnquiry(errEnquiry);
    }
  }
  function handleFileChangeUpdateMode(selectedFile, fileIndex, message) {
    let newFileName = "";
    if (selectedFile) {
      newFileName = selectedFile.name;
    } else {
      // user selected a new file but then deselected
      newFileName = "";
    }
    setEnquiry({
      ...enquiry,
      // file: file,
      ["file" + fileIndex]: selectedFile,
      [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      // [singleFileList[fileIndex].fileAttributeName]: selectedFile.name,
    });
    let errEnquiry = { ...errorEnquiry };
    errEnquiry[singleFileList[fileIndex].fileAttributeName].message = message;
    setErrorEnquiry(errEnquiry);
  }
  function handleCancelChangeImageClick() {
    if (action == "update") {
      let fl = [...singleFileList];
      fl[fileIndex]["newFileName"] = "";
      fl[fileIndex]["newFile"] = "";
      setSingleFileList(fl);
    }
  }
  function handleSelectCategoryChange(event) {
    let category = event.target.value.trim();
    let categoryId = event.target.selectedOptions[0].id;
    setEnquiry({ ...enquiry, category: category, categoryId: categoryId });
  }
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new enquiry" : "Update enquiry"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Track and manage customer enquiries efficiently.
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Customer</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="customer"
                  list={action === "add" ? "customerOptions" : undefined}
                  value={enquiry.customer || ""}
                  readOnly={action === "update"}
                  onChange={action === "add" ? (e) => {
                    const inputValue = e.target.value;
                    // Find matching customer from the list
                    const matchedCustomer = props.customerList.find(customer => {
                      const displayName = customer.whatsappNumber 
                        ? `${customer.name} (${customer.whatsappNumber})`
                        : customer.name;
                      return displayName === inputValue || displayName.toLowerCase().includes(inputValue.toLowerCase());
                    });
                    
                    if (matchedCustomer) {
                      const displayName = matchedCustomer.whatsappNumber 
                        ? `${matchedCustomer.name} (${matchedCustomer.whatsappNumber})`
                        : matchedCustomer.name;
                      setEnquiry({ ...enquiry, customer: displayName, customerId: matchedCustomer._id });
                    } else {
                      // If no match, just update the text value but keep customerId if it was set
                      setEnquiry({ ...enquiry, customer: inputValue });
                    }
                  } : undefined}
                  onBlur={action === "add" ? (e) => {
                    // On blur, try to find exact match
                    const inputValue = e.target.value;
                    const matchedCustomer = props.customerList.find(customer => {
                      const displayName = customer.whatsappNumber 
                        ? `${customer.name} (${customer.whatsappNumber})`
                        : customer.name;
                      return displayName === inputValue;
                    });
                    
                    if (matchedCustomer) {
                      const displayName = matchedCustomer.whatsappNumber 
                        ? `${matchedCustomer.name} (${matchedCustomer.whatsappNumber})`
                        : matchedCustomer.name;
                      setEnquiry({ ...enquiry, customer: displayName, customerId: matchedCustomer._id });
                    }
                    handleBlur(e);
                  } : handleBlur}
                  onFocus={handleFocus}
                  placeholder={action === "add" ? "Type or select customer" : ""}
                  style={action === "update" ? { backgroundColor: "#f8f9fa", cursor: "not-allowed" } : {}}
                />
                <datalist id="customerOptions">
                  {props.customerList.map((customer, index) => {
                    const displayName = customer.whatsappNumber 
                      ? `${customer.name} (${customer.whatsappNumber})`
                      : customer.name;
                    return (
                      <option value={displayName} key={index}>
                        {displayName}
                      </option>
                    );
                  })}
                </datalist>
              </div>
            </div>
            <div className="">
              {errorEnquiry.customer?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorEnquiry.customer.message}
                </span>
              ) : null}
            </div>
          </div>
                
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Status</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-flag"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="status"
                  value={enquiry.status || ""}
                  onChange={(e) => {
                    setEnquiry({ ...enquiry, status: e.target.value });
                    let errEnquiry = { ...errorEnquiry };
                    errEnquiry.status.message = "";
                    setErrorEnquiry(errEnquiry);
                  }}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="in-process">In-Process</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="">
              {errorEnquiry.status?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorEnquiry.status.message}
                </span>
              ) : null}
            </div>
          </div>
          
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Code</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-hash"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="code"
                  value={enquiry.code || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Auto-generated code"
                  readOnly={true}
                  style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                />
              </div>
            </div>
            <div className="">
              {errorEnquiry.code?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorEnquiry.code.message}
                </span>
              ) : null}
            </div>
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
    </div>
  );
}
