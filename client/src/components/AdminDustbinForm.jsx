import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";
import MapEditor from "./MapEditor";

export default function AdminDustbinForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [dustbin, setDustbin] = useState("");
  let [errorDustbin, setErrorDustbin] = useState(props.dustbinValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let { emptyDustbin } = props;
  let { dustbinToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { dustbinSchema } = props;
  let { areaList } = props;
  let { driverList } = props;
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);

  function init() {
    let { action } = props;
    if (action === "add") {
      setDustbin(props.emptyDustbin);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyDustbin).filter(
        (key) => !Object.keys(dustbinToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        dustbinToBeEdited[key] = "";
      });
      setDustbin(props.dustbinToBeEdited);
    }
  }

  function handleTextFieldChange(event) {
    let name = event.target.name;
    setDustbin({ ...dustbin, [name]: event.target.value });
    let message = fieldValidate(event, errorDustbin);
    let errDustbin = { ...errorDustbin };
    if (errorDustbin[`${name}`]) {
      errorDustbin[`${name}`].message = message;
    }
    setErrorDustbin(errDustbin);
  }

  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorDustbin);
    let errDustbin = { ...errorDustbin };
    if (errorDustbin[`${name}`]) {
      errorDustbin[`${name}`].message = message;
    }
    setErrorDustbin(errDustbin);
  }

  function handleFocus(event) {
    setFlagFormInvalid(false);
  }

  function handleSelectChange(event) {
    let name = event.target.name;
    setDustbin({ ...dustbin, [name]: event.target.value });
  }

  function handleDateChange(event) {
    let name = event.target.name;
    setDustbin({ ...dustbin, [name]: event.target.value });
  }

  function checkAllErrors() {
    let errDustbin = { ...errorDustbin };
    let flag = false;
    
    // First, clear "Required..." messages for fields that now have values
    // Required fields: binName, areaId, address, status
    const requiredFields = ["binName", "areaId", "address", "status"];
    for (let field of requiredFields) {
      if (errDustbin[field]) {
        if (!dustbin[field] || dustbin[field] === "") {
          // Field is empty - mark as required
          errDustbin[field].message = "Required...";
          flag = true;
        } else {
          // Field has value - clear the "Required..." error if that's the only error
          if (errDustbin[field].message === "Required...") {
            errDustbin[field].message = "";
          }
        }
      }
    }
    
    // Now check for any remaining validation errors (length, format, etc.)
    for (let field in errDustbin) {
      if (errDustbin[field] && errDustbin[field].message !== "") {
        flag = true;
      }
    }
    
    if (flag) {
      setErrorDustbin(errDustbin);
      return true;
    }
    return false;
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (checkAllErrors()) {
      setFlagFormInvalid(true);
      return;
    }
    setFlagFormInvalid(false);
    props.onFormSubmit(dustbin);
  };

  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new dustbin" : "Update dustbin"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage dustbin information and location details.
            </p>
          </div>

          {/* Bin Name */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Bin Name *</label>
            </div>
            <div className="px-0">
              <input
                type="text"
                className="form-control"
                name="binName"
                value={dustbin.binName || ""}
                onChange={handleTextFieldChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder="Enter bin name"
              />
            </div>
            <div className="">
              {errorDustbin.binName && errorDustbin.binName.message ? (
                <span className="text-danger">
                  {errorDustbin.binName.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Area */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Area / Zone *</label>
            </div>
            <div className="px-0">
              <select
                className="form-control"
                name="areaId"
                value={dustbin.areaId || ""}
                onChange={handleSelectChange}
              >
                <option value="">Select area</option>
                {areaList && areaList.map((area) => (
                  <option key={area._id} value={area._id}>
                    {area.areaName} ({area.areaCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="">
              {errorDustbin.areaId && errorDustbin.areaId.message ? (
                <span className="text-danger">
                  {errorDustbin.areaId.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Address */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Address / Landmark *</label>
            </div>
            <div className="px-0">
              <input
                type="text"
                className="form-control"
                name="address"
                value={dustbin.address || ""}
                onChange={handleTextFieldChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder="Enter address or landmark"
              />
            </div>
            <div className="">
              {errorDustbin.address && errorDustbin.address.message ? (
                <span className="text-danger">
                  {errorDustbin.address.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Status */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Status *</label>
            </div>
            <div className="px-0">
              <select
                className="form-control"
                name="status"
                value={dustbin.status || ""}
                onChange={handleSelectChange}
              >
                <option value="">Select status</option>
                <option value="Empty">Empty</option>
                <option value="Half">Half</option>
                <option value="Full">Full</option>
              </select>
            </div>
            <div className="">
              {errorDustbin.status && errorDustbin.status.message ? (
                <span className="text-danger">
                  {errorDustbin.status.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Capacity */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Capacity (Optional)</label>
            </div>
            <div className="px-0">
              <input
                type="text"
                className="form-control"
                name="capacity"
                value={dustbin.capacity || ""}
                onChange={handleTextFieldChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder="Enter capacity"
              />
            </div>
            <div className="">
              {errorDustbin.capacity && errorDustbin.capacity.message ? (
                <span className="text-danger">
                  {errorDustbin.capacity.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Last Cleaned Date */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Last Cleaned Date</label>
            </div>
            <div className="px-0">
              <input
                type="datetime-local"
                className="form-control"
                name="lastCleanedDate"
                value={dustbin.lastCleanedDate || ""}
                onChange={handleDateChange}
              />
            </div>
          </div>

          {/* Assigned Driver */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Assigned Driver</label>
            </div>
            <div className="px-0">
              <select
                className="form-control"
                name="assignedDriverId"
                value={dustbin.assignedDriverId || ""}
                onChange={handleSelectChange}
              >
                <option value="">Not Assigned</option>
                {driverList && driverList.filter(d => d.activeStatus).map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.driverName} - {driver.vehicleNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="">
              <small className="text-muted">Optional - Assign a driver to this dustbin</small>
            </div>
          </div>

          {/* Remarks */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Remarks</label>
            </div>
            <div className="px-0">
              <textarea
                className="form-control"
                name="remarks"
                rows="3"
                value={dustbin.remarks || ""}
                onChange={handleTextFieldChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                placeholder="Enter any remarks or notes"
              />
            </div>
            <div className="">
              {errorDustbin.remarks && errorDustbin.remarks.message ? (
                <span className="text-danger">
                  {errorDustbin.remarks.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Location Map */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Location (Click map to set coordinates)</label>
            </div>
            <div style={{ height: 450, border: "1px solid #ddd", borderRadius: "4px" }}>
              <MapEditor
                value={dustbin.location || { lat: 20.5937, lng: 78.9629 }}
                onChange={(loc) => setDustbin({ ...dustbin, location: loc })}
                zoom={dustbin.location ? 13 : 5}
              />
            </div>
            {dustbin.location && (
              <div className="mt-2">
                <small className="text-muted">
                  Lat: {typeof dustbin.location.lat === 'number' ? dustbin.location.lat.toFixed(6) : dustbin.location.lat || 'N/A'}, 
                  Lng: {typeof dustbin.location.lng === 'number' ? dustbin.location.lng.toFixed(6) : dustbin.location.lng || 'N/A'}
                </small>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="col-12 mt-3">
            <button
              className="btn btn-primary"
              type="submit"
            >
              {(action + " " + selectedEntity.singularName).toUpperCase()}
            </button>
            {" "}
            <span className="text-danger">
              {flagFormInvalid ? "Missing required data.." : ""}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
