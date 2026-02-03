import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminDriverForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [driver, setDriver] = useState("");
  let [errorDriver, setErrorDriver] = useState(props.driverValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyDriver } = props;
  let { driverToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { driverSchema } = props;
  let { userList } = props;
  let { areaList } = props;
  
  // Filter users to show only those with role = "driver"
  const driverUsers = userList.filter(user => user.role === "driver");
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);

  function init() {
    let { action } = props;
    if (action === "add") {
      let initialDriver = { ...props.emptyDriver };
      initialDriver.assignedAreaIds = [];
      initialDriver.activeStatus = true;
      setDriver(initialDriver);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyDriver).filter(
        (key) => !Object.keys(driverToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        driverToBeEdited[key] = "";
      });
      // Ensure assignedAreaIds is an array
      if (!driverToBeEdited.assignedAreaIds || !Array.isArray(driverToBeEdited.assignedAreaIds)) {
        driverToBeEdited.assignedAreaIds = [];
      }
      setDriver(props.driverToBeEdited);
    }
  }

  function handleTextFieldChange(event) {
    let name = event.target.name;
    setDriver({ ...driver, [name]: event.target.value });
    let message = fieldValidate(event, errorDriver);
    let errDriver = { ...errorDriver };
    if (errorDriver[`${name}`]) {
      errorDriver[`${name}`].message = message;
    }
    setErrorDriver(errDriver);
  }

  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorDriver);
    let errDriver = { ...errorDriver };
    if (errorDriver[`${name}`]) {
      errorDriver[`${name}`].message = message;
    }
    setErrorDriver(errDriver);
  }

  function handleFocus(event) {
    setFlagFormInvalid(false);
  }

  function handleUserSelectChange(event) {
    let userId = event.target.value;
    let selectedUser = driverUsers.find(u => u._id === userId);
    
    setDriver({ 
      ...driver, 
      userId: userId,
      driverName: selectedUser ? selectedUser.name : "",
      mobileNumber: selectedUser ? (selectedUser.mobileNumber || "") : ""
    });
  }

  function handleActiveStatusChange(event) {
    setDriver({ ...driver, activeStatus: event.target.checked });
  }

  function handleAreaCheckboxChange(event) {
    const areaId = event.target.value;
    const isChecked = event.target.checked;
    
    let updatedAreaIds = [...(driver.assignedAreaIds || [])];
    
    if (isChecked) {
      if (!updatedAreaIds.includes(areaId)) {
        updatedAreaIds.push(areaId);
      }
    } else {
      updatedAreaIds = updatedAreaIds.filter(id => id !== areaId);
    }
    
    setDriver({ ...driver, assignedAreaIds: updatedAreaIds });
  }

  function checkAllErrors() {
    for (let field in errorDriver) {
      if (errorDriver[field] && errorDriver[field].message !== "") {
        return true;
      }
    }
    let errDriver = { ...errorDriver };
    let flag = false;
    // Required fields: userId, driverName, mobileNumber, vehicleNumber
    const requiredFields = ["userId", "driverName", "mobileNumber", "vehicleNumber"];
    for (let field of requiredFields) {
      if (errorDriver[field] && (!driver[field] || driver[field] === "")) {
        flag = true;
        if (errDriver[field]) {
          errDriver[field].message = "Required...";
        }
      }
    }
    if (flag) {
      setErrorDriver(errDriver);
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
    props.onFormSubmit(driver);
  };

  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new driver" : "Update driver"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage driver information and area assignments.
            </p>
          </div>

          {/* User Selection */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Select User (Driver Role) *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person-badge"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="userId"
                  value={driver.userId || ""}
                  onChange={handleUserSelectChange}
                  disabled={action === "update"}
                >
                  <option value="">Select a user</option>
                  {driverUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.emailId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="">
              {errorDriver.userId && errorDriver.userId.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorDriver.userId.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Driver Name */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Driver Name *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="driverName"
                  value={driver.driverName || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter driver name"
                />
              </div>
            </div>
            <div className="">
              {errorDriver.driverName && errorDriver.driverName.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorDriver.driverName.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Mobile Number */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Mobile Number *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-phone"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="mobileNumber"
                  value={driver.mobileNumber || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>
            <div className="">
              {errorDriver.mobileNumber && errorDriver.mobileNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorDriver.mobileNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Vehicle Number */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Vehicle Number *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-truck"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="vehicleNumber"
                  value={driver.vehicleNumber || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter vehicle number"
                />
              </div>
            </div>
            <div className="">
              {errorDriver.vehicleNumber && errorDriver.vehicleNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorDriver.vehicleNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Assigned Areas - Multi-select */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Assigned Areas</label>
            </div>
            <div className="px-0">
              <div className="border rounded p-3" style={{ maxHeight: "250px", overflowY: "auto" }}>
                {areaList && areaList.length > 0 ? (
                  areaList.map((area) => (
                    <div key={area._id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={area._id}
                        id={`area-${area._id}`}
                        checked={driver.assignedAreaIds && driver.assignedAreaIds.includes(area._id)}
                        onChange={handleAreaCheckboxChange}
                      />
                      <label className="form-check-label" htmlFor={`area-${area._id}`}>
                        {area.areaName} ({area.areaCode})
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted mb-0">No areas available. Please add areas first.</p>
                )}
              </div>
            </div>
            <div className="mt-1">
              <small className="text-muted">
                {driver.assignedAreaIds && driver.assignedAreaIds.length > 0 
                  ? `${driver.assignedAreaIds.length} area(s) selected`
                  : "No areas selected"}
              </small>
            </div>
          </div>

          {/* Active Status */}
          <div className={cols + " my-2"}>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="activeStatusSwitch"
                name="activeStatus"
                checked={driver.activeStatus === true || driver.activeStatus === "true"}
                onChange={handleActiveStatusChange}
              />
              <label className="form-check-label fw-semibold" htmlFor="activeStatusSwitch">
                Active Status
              </label>
            </div>
            <small className="text-muted">
              {driver.activeStatus ? "Driver is active and can be assigned to tasks" : "Driver is inactive"}
            </small>
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
