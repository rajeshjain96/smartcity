import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminAreaForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [area, setArea] = useState("");
  let [errorArea, setErrorArea] = useState(props.areaValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyArea } = props;
  let { areaToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { areaSchema } = props;
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);

  function init() {
    let { action } = props;
    if (action === "add") {
      setArea(props.emptyArea);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyArea).filter(
        (key) => !Object.keys(areaToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        areaToBeEdited[key] = "";
      });
      setArea(props.areaToBeEdited);
    }
  }

  function handleTextFieldChange(event) {
    let name = event.target.name;
    setArea({ ...area, [name]: event.target.value });
    let message = fieldValidate(event, errorArea);
    let errArea = { ...errorArea };
    if (errorArea[`${name}`]) {
      errorArea[`${name}`].message = message;
    }
    setErrorArea(errArea);
  }

  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorArea);
    let errArea = { ...errorArea };
    if (errorArea[`${name}`]) {
      errorArea[`${name}`].message = message;
    }
    setErrorArea(errArea);
  }

  function handleFocus(event) {
    setFlagFormInvalid(false);
  }

  function handleSelectChange(event) {
    let name = event.target.name;
    setArea({ ...area, [name]: event.target.value });
  }

  function checkAllErrors() {
    for (let field in errorArea) {
      if (errorArea[field] && errorArea[field].message !== "") {
        return true;
      }
    }
    let errArea = { ...errorArea };
    let flag = false;
    // Required fields: areaName, areaCode, activeStatus
    const requiredFields = ["areaName", "areaCode", "activeStatus"];
    for (let field of requiredFields) {
      if (errorArea[field] && (!area[field] || area[field] === "")) {
        flag = true;
        if (errArea[field]) {
          errArea[field].message = "Required...";
        }
      }
    }
    if (flag) {
      setErrorArea(errArea);
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
    props.onFormSubmit(area);
  };

  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new area" : "Update area"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage area/zone information and details.
            </p>
          </div>

          {/* Area Name */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Area Name *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-geo-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="areaName"
                  value={area.areaName || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter area name"
                />
              </div>
            </div>
            <div className="">
              {errorArea.areaName && errorArea.areaName.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorArea.areaName.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Area Code */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Area Code *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-tag"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="areaCode"
                  value={area.areaCode || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter area code"
                />
              </div>
            </div>
            <div className="">
              {errorArea.areaCode && errorArea.areaCode.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorArea.areaCode.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Active Status */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Active Status *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-toggle-on"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="activeStatus"
                  value={area.activeStatus || ""}
                  onChange={handleSelectChange}
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="">
              {errorArea.activeStatus && errorArea.activeStatus.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorArea.activeStatus.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Description</label>
            </div>
            <div className="px-0">
              <div className="customer-textarea-wrapper">
                <textarea
                  className="form-control customer-input customer-textarea"
                  name="description"
                  rows={4}
                  value={area.description || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <div className="">
              {errorArea.description && errorArea.description.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorArea.description.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Form Actions */}
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
