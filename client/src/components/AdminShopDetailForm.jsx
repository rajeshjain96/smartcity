import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";
import SingleFileUpload from "./SingleFileUpload";

export default function AdminShopDetailForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [shopDetail, setShopDetail] = useState("");
  let [errorShopDetail, setErrorShopDetail] = useState(props.shopDetailValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyShopDetail } = props;
  let { shopDetailToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { shopDetailSchema } = props;
  let { loggedInUser } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromShopDetailSchema()
  );
  let [fileIndex, setFileIndex] = useState(0);
  
  function getSingleFileListFromShopDetailSchema() {
    let list = [];
    if (!shopDetailSchema || !Array.isArray(shopDetailSchema)) {
      return list;
    }
    shopDetailSchema.forEach((e, index) => {
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
    if (shopDetailSchema) {
      setSingleFileList(getSingleFileListFromShopDetailSchema());
    }
  }, [shopDetailSchema]);
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  
  function init() {
    let { action } = props;
    if (action === "add") {
      setShopDetail({ ...props.emptyShopDetail, shopurl: loggedInUser?.shopurl || "" });
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyShopDetail).filter(
        (key) => !Object.keys(shopDetailToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        shopDetailToBeEdited[key] = "";
      });
      setShopDetail(props.shopDetailToBeEdited);
    }
  }
  
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setShopDetail({ ...shopDetail, [name]: event.target.value });
    let message = fieldValidate(event, errorShopDetail);
    let errShopDetail = { ...errorShopDetail };
    errorShopDetail[`${name}`].message = message;
    setErrorShopDetail(errShopDetail);
  }
  
  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorShopDetail);
    let errShopDetail = { ...errorShopDetail };
    errorShopDetail[`${name}`].message = message;
    setErrorShopDetail(errShopDetail);
  }
  
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  
  function checkAllErrors() {
    for (let field in errorShopDetail) {
      if (errorShopDetail[field].message !== "") {
        return true;
      }
    }
    let errShopDetail = { ...errorShopDetail };
    let flag = false;
    for (let field in shopDetail) {
      // Skip optional fields
      if (field === "gstNumber" || field === "logo") {
        continue;
      }
      if (errorShopDetail[field] && shopDetail[field] == "") {
        flag = true;
        errShopDetail[field].message = "Required...";
      }
    }
    if (flag) {
      setErrorShopDetail(errShopDetail);
      return true;
    }
    return false;
  }
  
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setHasValidated(true);
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    if (action == "update") {
      let pr = { ...shopDetail };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      }
      setShopDetail(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(shopDetail);
    }
  };
  
  function handleFileChange(selectedFile, fileIndex, message) {
    setFlagFormInvalid(false);
    if (action == "add") {
      const timestamp = Date.now();
      const ext = selectedFile.name.split(".").pop();
      const base = selectedFile.name.replace(/\.[^/.]+$/, "");
      const newName = `${base}-${timestamp}.${ext}`;
      const renamedFile = new File([selectedFile], newName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
      });
      setShopDetail({
        ...shopDetail,
        ["file" + fileIndex]: renamedFile,
        [singleFileList[fileIndex].fileAttributeName]: newName,
      });
      let errShopDetail = { ...errorShopDetail };
      errShopDetail[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShopDetail(errShopDetail);
    }
  }
  
  function handleFileRemove(selectedFile, fileIndex, message) {
    if (action == "add") {
      setFlagFormInvalid(false);
      setShopDetail({
        ...shopDetail,
        [singleFileList[fileIndex].fileAttributeName]: "",
      });
      let errShopDetail = { ...errorShopDetail };
      errShopDetail[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShopDetail(errShopDetail);
    } else if (action == "update") {
      let newFileName = "";
      if (selectedFile) {
        newFileName = selectedFile.name;
      } else {
        newFileName = "";
      }
      setShopDetail({
        ...shopDetail,
        ["file" + fileIndex]: selectedFile,
        [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
      });
      let errShopDetail = { ...errorShopDetail };
      errShopDetail[singleFileList[fileIndex].fileAttributeName].message = message;
      setErrorShopDetail(errShopDetail);
    }
  }
  
  function handleFileChangeUpdateMode(selectedFile, fileIndex, message) {
    let newFileName = "";
    if (selectedFile) {
      newFileName = selectedFile.name;
    } else {
      newFileName = "";
    }
    setShopDetail({
      ...shopDetail,
      ["file" + fileIndex]: selectedFile,
      [singleFileList[fileIndex].fileAttributeName + "New"]: newFileName,
    });
    let errShopDetail = { ...errorShopDetail };
    errShopDetail[singleFileList[fileIndex].fileAttributeName].message = message;
    setErrorShopDetail(errShopDetail);
  }
  
  function handleCancelChangeImageClick() {
    if (action == "update") {
      let fl = [...singleFileList];
      fl[fileIndex]["newFileName"] = "";
      fl[fileIndex]["newFile"] = "";
      setSingleFileList(fl);
    }
  }
  
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new shop detail" : "Update shop detail"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage shop information and details.
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Shop Name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-shop"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="shopName"
                  value={shopDetail.shopName || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter shop name"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.shopName.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.shopName.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Address</label>
            </div>
            <div className="px-0">
              <div className="customer-textarea-wrapper">
                <textarea
                  className="form-control customer-input customer-textarea"
                  name="address"
                  rows={3}
                  value={shopDetail.address || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter shop address"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.address.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.address.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Mobile Number</label>
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
                  value={shopDetail.mobileNumber || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.mobileNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.mobileNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Email ID</label>
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
                  value={shopDetail.emailId || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.emailId.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.emailId.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Owner Name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="ownerName"
                  value={shopDetail.ownerName || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter owner name"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.ownerName.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.ownerName.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">GST Number</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-receipt"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="gstNumber"
                  value={shopDetail.gstNumber || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter GST number (optional)"
                />
              </div>
            </div>
            <div className="">
              {errorShopDetail.gstNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorShopDetail.gstNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          {singleFileList.length > 0 && singleFileList.map((fileItem, index) => {
            const fileIndex = index;
            return (
              <div key={index} className={cols + " my-2"}>
                <div className="text-bold my-1">
                  <label className="form-label fw-semibold">
                    {fileItem.fileAttributeName.charAt(0).toUpperCase() + fileItem.fileAttributeName.slice(1)}
                  </label>
                </div>
                <div className="px-0">
                  <SingleFileUpload
                    name={fileItem.fileAttributeName}
                    singleFileList={singleFileList}
                    fileIndex={fileIndex}
                    action={action}
                    image={shopDetail[fileItem.fileAttributeName]}
                    fileName={shopDetail[fileItem.fileAttributeName]}
                    VITE_API_URL={import.meta.env.VITE_API_URL}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    onFileChangeUpdateMode={handleFileChangeUpdateMode}
                  />
                </div>
                <div className="">
                  {errorShopDetail[fileItem.fileAttributeName]?.message ? (
                    <span className="form-error-message">
                      <i className="bi bi-exclamation-circle"></i>
                      {errorShopDetail[fileItem.fileAttributeName].message}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

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
                        UPDATE SHOP DETAIL
                      </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

