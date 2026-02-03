import { useEffect, useState } from "react";
// import { fieldValidate } from "../external/vite-sdk";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
// import { SingleFileUpload } from "../external/vite-sdk";
import formLayout from "./FormLayout";
export default function AdminCustomerForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [customer, setCustomer] = useState("");
  let [errorCustomer, setErrorCustomer] = useState(props.customerValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyCustomer } = props;
  let { customerToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { customerSchema } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromCustomerSchema()
  );
  function getSingleFileListFromCustomerSchema() {
    let list = [];
    customerSchema.forEach((e, index) => {
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
  function init() {
    let { action } = props;
    if (action === "add") {
      // emptyCustomer.category = props.categoryToRetain;
      // emptyCustomer.categoryId = props.categoryIdToRetain;
      setCustomer(props.emptyCustomer);
      // Don't show positive message until form has been validated
      setHasValidated(false);
    } else if (action === "update") {
      // in edit mode, keep the update button enabled at the beginning
      setFlagFormInvalid(false);
      // find missing keys
      const missing = Object.keys(emptyCustomer).filter(
        (key) => !Object.keys(customerToBeEdited).includes(key)
      );
      // add them to objB with empty string
      missing.forEach((key) => {
        customerToBeEdited[key] = "";
      });
      setCustomer(props.customerToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setCustomer({ ...customer, [name]: event.target.value });
    let message = fieldValidate(event, errorCustomer);
    let errCustomer = { ...errorCustomer };
    errorCustomer[`${name}`].message = message;
    setErrorCustomer(errCustomer);
  }
  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorCustomer);
    let errCustomer = { ...errorCustomer };
    errorCustomer[`${name}`].message = message;
    setErrorCustomer(errCustomer);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function handleRadioFieldChange(event) {
    let name = event.target.name;
    setCustomer({ ...customer, [name]: event.target.value });
  }
  function handleCheckBoxChange(event) {
    const { name, value, checked } = event.target;
    if (checked) {
      // Add value to array for that name
      setCustomer({ ...customer, [name]: [...customer[`${name}`], value] });
    } else {
      // Remove value from array for that name
      setCustomer({
        ...customer,
        [name]: customer[`${name}`].filter((e) => e !== value),
      });
    }
  }
  function checkAllErrors() {
    for (let field in errorCustomer) {
      if (errorCustomer[field].message !== "") {
        return true;
      } //if
    } //for
    let errCustomer = { ...errorCustomer };
    let flag = false;
    for (let field in customer) {
      if (errorCustomer[field] && customer[field] == "") {
        flag = true;
        errCustomer[field].message = "Required...";
      } //if
    } //for
    if (flag) {
      setErrorCustomer(errCustomer);
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
      let pr = { ...customer };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          // image is modified
          // if field-name is image, temporarily in "imageNew" field, new file-name is saved.
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      } //for
      setCustomer(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(customer);
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
      setCustomer({
        ...customer,
        ["file" + fileIndex]: renamedFile,
        [singleFileList[fileIndex].fileAttributeName]: newName,
      });
      let errCustomer = { ...errorCustomer };
      errCustomer[singleFileList[fileIndex].fileAttributeName].message =
        message;
      setErrorCustomer(errCustomer);
      // setErrorCustomer({ ...errorCustomer, message: message });
    }
  }
  function handleFileRemove(selectedFile, fileIndex, message) {
    if (action == "add") {
      setFlagFormInvalid(false);
      setCustomer({
        ...customer,
        [singleFileList[fileIndex].fileAttributeName]: "",
      });
      let errCustomer = { ...errorCustomer };
      errCustomer[singleFileList[fileIndex].fileAttributeName].message =
        message;
      setErrorCustomer(errCustomer);
    } else if (action == "update") {
      let newFileName = "";
      if (selectedFile) {
        newFileName = selectedFile.name;
      } else {
        // user selected a new file but then deselected
        newFileName = "";
      }
      setCustomer({
        ...customer,
        ["file" + fileIndex]: selectedFile,
        [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      });
      let errCustomer = { ...errorCustomer };
      errCustomer[singleFileList[fileIndex].fileAttributeName].message =
        message;
      setErrorCustomer(errCustomer);
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
    setCustomer({
      ...customer,
      // file: file,
      ["file" + fileIndex]: selectedFile,
      [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      // [singleFileList[fileIndex].fileAttributeName]: selectedFile.name,
    });
    let errCustomer = { ...errorCustomer };
    errCustomer[singleFileList[fileIndex].fileAttributeName].message = message;
    setErrorCustomer(errCustomer);
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
    setCustomer({ ...customer, category: category, categoryId: categoryId });
  }
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new customer" : "Update customer"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Keep your customer details up to date for smoother orders and
              communication.
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="name"
                  value={customer.name}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div className="">
              {errorCustomer.name.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCustomer.name.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Whatsapp Number</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-whatsapp"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="whatsappNumber"
                  value={customer.whatsappNumber}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="10-digit WhatsApp number"
                />
              </div>
            </div>
            <div className="">
              {errorCustomer.whatsappNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCustomer.whatsappNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Address</label>
            </div>
            <div className="px-0">
              <div className="customer-textarea-wrapper">
                <textarea
                  className="form-control customer-input customer-textarea"
                  name="address"
                  rows={3}
                  value={customer.address}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="House number, street, city, pincode"
                >
                  {" "}
                </textarea>
              </div>
            </div>
            <div className="">
              {errorCustomer.address.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCustomer.address.message}
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
                // disabled={flagFormInvalid}
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
