import { useEffect, useState } from "react";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function PickupRequestForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  
  const [request, setRequest] = useState({
    dustbinId: "",
    garbageType: "Household",
    notes: "",
    status: "Pending"
  });
  const [errors, setErrors] = useState({});
  const { dustbinList } = props;
  
  // Get selected dustbin details
  const selectedDustbin = dustbinList.find(d => d._id === request.dustbinId || d._id === request.dustbinId?.toString());

  function handleTextFieldChange(event) {
    let name = event.target.name;
    setRequest({ ...request, [name]: event.target.value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  }

  function handleSelectChange(event) {
    let name = event.target.name;
    setRequest({ ...request, [name]: event.target.value });
    
    // Clear error when user selects
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  }

  function validateForm() {
    let newErrors = {};
    
    if (!request.dustbinId) {
      newErrors.dustbinId = "Please select a dustbin";
    }
    
    if (!request.garbageType) {
      newErrors.garbageType = "Please select garbage type";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    props.onFormSubmit(request);
  };

  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              Request Garbage Pickup
            </h5>
            <p className="customer-form-subtitle mb-0">
              Submit a pickup request for garbage collection
            </p>
          </div>

          {/* Dustbin Selection */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Select Dustbin *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-trash"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="dustbinId"
                  value={request.dustbinId}
                  onChange={handleSelectChange}
                >
                  <option value="">Select dustbin location</option>
                  {dustbinList && dustbinList.map((dustbin) => (
                    <option key={dustbin._id} value={dustbin._id}>
                      {dustbin.binName} - {dustbin.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.dustbinId && (
              <div className="text-danger small mt-1">
                <i className="bi bi-exclamation-circle"></i> {errors.dustbinId}
              </div>
            )}
          </div>

          {/* Garbage Type */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Garbage Type *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-layers"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="garbageType"
                  value={request.garbageType}
                  onChange={handleSelectChange}
                >
                  <option value="Household">Household</option>
                  <option value="Recyclable">Recyclable</option>
                  <option value="E-Waste">E-Waste</option>
                  <option value="Medical">Medical</option>
                </select>
              </div>
            </div>
            {errors.garbageType && (
              <div className="text-danger small mt-1">
                <i className="bi bi-exclamation-circle"></i> {errors.garbageType}
              </div>
            )}
          </div>

          {/* Dustbin Location Info (Read-only) */}
          {selectedDustbin && (
            <div className="col-12 my-2">
              <div className="text-bold my-1">
                <label className="form-label fw-semibold">Pickup Location</label>
              </div>
              <div className="px-0">
                <div className="alert alert-info mb-0" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Dustbin:</strong> {selectedDustbin.binName}
                  {selectedDustbin.address && (
                    <>
                      <br />
                      <strong>Address:</strong> {selectedDustbin.address}
                    </>
                  )}
                  {selectedDustbin.remarks && (
                    <>
                      <br />
                      <small className="text-muted">{selectedDustbin.remarks}</small>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="col-12 my-2">
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Additional Notes</label>
            </div>
            <div className="px-0">
              <textarea
                className="form-control"
                name="notes"
                rows="3"
                value={request.notes}
                onChange={handleTextFieldChange}
                placeholder="Any special instructions or notes (optional)"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="col-12 mt-3 d-flex gap-2 justify-content-end customer-form-actions">
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
              SUBMIT REQUEST
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
