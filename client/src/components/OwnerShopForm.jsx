import { useEffect, useState } from "react";
// import { fieldValidate } from "../external/vite-sdk";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
// import { SingleFileUpload } from "../external/vite-sdk";
import formLayout from "./FormLayout";
export default function OwnerShopForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [shop, setShop] = useState("");
  let [errorShop, setErrorShop] = useState(props.shopValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let { emptyShop } = props;
  let { shopToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { shopSchema } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromShopSchema()
  );
  function getSingleFileListFromShopSchema() {
    let list = [];
    shopSchema.forEach((e, index) => {
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
      // emptyShop.category = props.categoryToRetain;
      // emptyShop.categoryId = props.categoryIdToRetain;
      setShop(props.emptyShop);
    } else if (action === "update") {
      // in edit mode, keep the update button enabled at the beginning
      setFlagFormInvalid(false);
      // find missing keys
      const missing = Object.keys(emptyShop).filter(
        (key) => !Object.keys(shopToBeEdited).includes(key)
      );
      // add them to objB with empty string
      missing.forEach((key) => {
        shopToBeEdited[key] = "";
      });
      setShop(props.shopToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setShop({ ...shop, [name]: event.target.value });
    let message = fieldValidate(event, errorShop);
    let errShop = { ...errorShop };
    errorShop[`${name}`].message = message;
    setErrorShop(errShop);
  }
  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorShop);
    let errShop = { ...errorShop };
    errorShop[`${name}`].message = message;
    setErrorShop(errShop);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function handleRadioFieldChange(event) {
    let name = event.target.name;
    setShop({ ...shop, [name]: event.target.value });
  }
  function handleCheckBoxChange(event) {
    const { name, value, checked } = event.target;
    if (checked) {
      // Add value to array for that name
      setShop({ ...shop, [name]: [...shop[`${name}`], value] });
    } else {
      // Remove value from array for that name
      setShop({
        ...shop,
        [name]: shop[`${name}`].filter((e) => e !== value),
      });
    }
  }
  function checkAllErrors() {
    for (let field in errorShop) {
      if (errorShop[field].message !== "") {
        return true;
      } //if
    } //for
    let errShop = { ...errorShop };
    let flag = false;
    for (let field in shop) {
      if (errorShop[field] && shop[field] == "") {
        flag = true;
        errShop[field].message = "This field is required";
      } //if
    } //for
    if (flag) {
      setErrorShop(errShop);
      return true;
    }
    return false;
  }
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // for dropdown, data is to be modified
    // first check whether all entries are valid or not
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    if (action == "update") {
      // There might be files in this form, add those also
      let pr = { ...shop };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          // image is modified
          // if field-name is image, temporarily in "imageNew" field, new file-name is saved.
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      } //for
      setShop(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(shop);
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
      setShop({
        ...shop,
        ["file" + fileIndex]: renamedFile,
        [singleFileList[fileIndex].fileAttributeName]: newName,
      });
      let errShop = { ...errorShop };
      errShop[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShop(errShop);
      // setErrorShop({ ...errorShop, message: message });
    }
  }
  function handleFileRemove(selectedFile, fileIndex, message) {
    if (action == "add") {
      setFlagFormInvalid(false);
      setShop({
        ...shop,
        [singleFileList[fileIndex].fileAttributeName]: "",
      });
      let errShop = { ...errorShop };
      errShop[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShop(errShop);
    } else if (action == "update") {
      let newFileName = "";
      if (selectedFile) {
        newFileName = selectedFile.name;
      } else {
        // user selected a new file but then deselected
        newFileName = "";
      }
      setShop({
        ...shop,
        ["file" + fileIndex]: selectedFile,
        [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      });
      let errShop = { ...errorShop };
      errShop[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShop(errShop);
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
    setShop({
      ...shop,
      // file: file,
      ["file" + fileIndex]: selectedFile,
      [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      // [singleFileList[fileIndex].fileAttributeName]: selectedFile.name,
    });
    let errShop = { ...errorShop };
    errShop[singleFileList[fileIndex].fileAttributeName].message = message;
    setErrorShop(errShop);
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
    setShop({ ...shop, category: category, categoryId: categoryId });
  }
  function handleFormCancelClick() {
    props.onFormCancelClick();
  }
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new shop" : "Update shop details"}
            </h5>
            <p className="customer-form-subtitle mb-0">
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Shop name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-shop"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="name"
                  value={shop.name}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter shop name"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.name.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.name.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Shop URL</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-link-45deg"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="shopurl"
                  value={shop.shopurl}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="e.g. homedecor-store"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.shopurl.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.shopurl.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Owner name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person-badge"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="shopowner"
                  value={shop.shopowner}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Owner full name"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.shopowner.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.shopowner.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Email</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control customer-input"
                  name="emailId"
                  value={shop.emailId}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Contact email address"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.emailId.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.emailId.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Mobile number</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-telephone"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="mobileNumber"
                  value={shop.mobileNumber}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.mobileNumber.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.mobileNumber.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">WhatsApp number</label>
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
                  value={shop.whatsappNumber}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="WhatsApp contact number"
                />
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.whatsappNumber.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.whatsappNumber.message}</span>
                </div>
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
                  value={shop.address}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Shop address, city and pincode"
                >
                  {" "}
                </textarea>
              </div>
            </div>
            <div className="validation-message-container">
              {errorShop.address.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.address.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Status</label>
            </div>
            <div className="px-0">
              <select
                className="form-control customer-input"
                name="status"
                value={shop.status}
                onChange={(e) => setShop({ ...shop, status: e.target.value })}
                onBlur={handleBlur}
                onFocus={handleFocus}
              >
                <option value="">-- Select status --</option>
                <option value="waiting" id="0">
                  Waiting
                </option>
                <option value="enabled" id="1">
                  Enabled
                </option>
                <option value="disabled" id="2">
                  Disabled
                </option>
                <option value="closed" id="3">
                  Closed
                </option>
              </select>
            </div>
            <div className="validation-message-container">
              {errorShop.status?.message ? (
                <div className="validation-message">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{errorShop.status.message}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-12 mt-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center customer-form-actions">
            <div className="small text-muted mb-2 mb-md-0">
              {flagFormInvalid
                ? "Please fix the highlighted fields."
                : "All fields look good. You can save now."}
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary px-3"
                onClick={handleFormCancelClick}
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
