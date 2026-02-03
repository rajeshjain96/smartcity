import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminRateForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [rate, setRate] = useState("");
  let [errorRate, setErrorRate] = useState(props.rateValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyRate } = props;
  let { rateToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { rateSchema, apRomanRateSchema, blindsRateSchema } = props;
  let { loggedInUser } = props;
  let { submitButtonLabel } = props;
  let { onRateChange } = props; // Callback to notify parent of rate changes
  let [activeTab, setActiveTab] = useState("apRoman"); // Track active tab
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, [rateToBeEdited]);
  
  function init() {
    let { action } = props;
    if (action === "add") {
      let initialRate = { ...props.emptyRate };
      // Pre-fill shopurl from loggedInUser
      if (loggedInUser && loggedInUser.shopurl) {
        initialRate.shopurl = loggedInUser.shopurl;
      }
      setRate(initialRate);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyRate).filter(
        (key) => !Object.keys(rateToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        rateToBeEdited[key] = "";
      });
      // Round blind rates and trackRatePerRunningFeet to integers
      const roundedRate = { ...rateToBeEdited };
      const blindRateFields = ['customisedBlindRate', 'fabricBlindRate', 'ecoBlackoutBlindRate', 'verticalBlindRate', 'zebraBlindRate'];
      blindRateFields.forEach(field => {
        if (roundedRate[field] !== undefined && roundedRate[field] !== null && roundedRate[field] !== "") {
          roundedRate[field] = Math.round(parseFloat(roundedRate[field]));
        }
      });
      if (roundedRate.trackRatePerRunningFeet !== undefined && roundedRate.trackRatePerRunningFeet !== null && roundedRate.trackRatePerRunningFeet !== "") {
        roundedRate.trackRatePerRunningFeet = Math.round(parseFloat(roundedRate.trackRatePerRunningFeet));
      }
      setRate(roundedRate);
      // Notify parent of initial rates for preview
      if (onRateChange) {
        onRateChange(roundedRate);
      }
    }
  }
  
  function handleTextFieldChange(event) {
    let name = event.target.name;
    const newRate = { ...rate, [name]: event.target.value };
    setRate(newRate);
    // Notify parent of rate changes for real-time preview
    if (onRateChange) {
      onRateChange(newRate);
    }
    let message = fieldValidate(event, errorRate);
    let errRate = { ...errorRate };
    errorRate[`${name}`].message = message;
    setErrorRate(errRate);
  }
  
  function handleBlur(event) {
    let name = event.target.name;
    let updatedRate = { ...rate };
    // Round numeric fields to 2 decimal places to avoid floating-point precision issues
    // Track rate and Blinds per sq. ft. rate should be integers
    if ((name === "perPlateStitchingRate" || name === "perSqFtStitchingRate" || name === "astarStitchingRate") && event.target.value !== "") {
      const numValue = parseFloat(event.target.value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue * 100) / 100;
        updatedRate[name] = roundedValue;
        setRate(updatedRate);
        event.target.value = roundedValue;
        // Notify parent of rate changes for real-time preview
        if (onRateChange) {
          onRateChange(updatedRate);
        }
      }
    } else if ((name === "trackRatePerRunningFeet" || name === "customisedBlindRate" || name === "fabricBlindRate" || name === "ecoBlackoutBlindRate" || name === "verticalBlindRate" || name === "zebraBlindRate") && event.target.value !== "") {
      const numValue = parseFloat(event.target.value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue); // Round to integer
        updatedRate[name] = roundedValue;
        setRate(updatedRate);
        event.target.value = roundedValue;
        // Notify parent of rate changes for real-time preview
        if (onRateChange) {
          onRateChange(updatedRate);
        }
      }
    }
    let message = fieldValidate(event, errorRate);
    let errRate = { ...errorRate };
    errorRate[`${name}`].message = message;
    setErrorRate(errRate);
  }
  
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  
  function checkAllErrors() {
    for (let field in errorRate) {
      if (errorRate[field].message !== "") {
        return true;
      }
    }
    let errRate = { ...errorRate };
    let flag = false;
    for (let field in rate) {
      if (errorRate[field] && rate[field] == "") {
        flag = true;
        errRate[field].message = "Required...";
      }
    }
    if (flag) {
      setErrorRate(errRate);
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
    props.onFormSubmit(rate);
  };
  
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              Update Curtain Rates
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage curtain-related service rates.
            </p>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-3" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "apRoman" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab("apRoman")}
              >
                AP/Roman
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === "blinds" ? "active" : ""}`}
                type="button"
                onClick={() => setActiveTab("blinds")}
              >
                Blinds
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* AP/Roman Tab */}
            {activeTab === "apRoman" && (
              <div className="tab-pane fade show active">
                {apRomanRateSchema && apRomanRateSchema.map(field => {
                  const { attribute, label } = field;
                  return (
                    <div className={cols + " my-2"} key={attribute}>
                      <div className="text-bold my-1">
                        <label className="form-label fw-semibold">{label}</label>
                      </div>
                      <div className="px-0">
                        <div className="input-group input-group-lg customer-input-group">
                          <span className="input-group-text customer-input-icon">
                            <i className="bi bi-currency-rupee"></i>
                          </span>
                          <input
                            type="number"
                            className="form-control customer-input"
                            name={attribute}
                            value={rate[attribute] || ""}
                            onChange={handleTextFieldChange}
                            onBlur={handleBlur}
                            onFocus={handleFocus}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            step={attribute === "trackRatePerRunningFeet" ? "1" : "0.01"}
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="">
                        {errorRate[attribute]?.message ? (
                          <span className="form-error-message">
                            <i className="bi bi-exclamation-circle"></i>
                            {errorRate[attribute].message}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Blinds Tab */}
            {activeTab === "blinds" && (
              <div className="tab-pane fade show active">
                {blindsRateSchema && blindsRateSchema.map(field => {
                  const { attribute, label } = field;
                  return (
                    <div className={cols + " my-2"} key={attribute}>
                      <div className="text-bold my-1">
                        <label className="form-label fw-semibold">{label}</label>
                      </div>
                      <div className="px-0">
                        <div className="input-group input-group-lg customer-input-group">
                          <span className="input-group-text customer-input-icon">
                            <i className="bi bi-currency-rupee"></i>
                          </span>
                          <input
                            type="number"
                            className="form-control customer-input"
                            name={attribute}
                            value={rate[attribute] || ""}
                            onChange={handleTextFieldChange}
                            onBlur={handleBlur}
                            onFocus={handleFocus}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            step="1"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="">
                        {errorRate[attribute]?.message ? (
                          <span className="form-error-message">
                            <i className="bi bi-exclamation-circle"></i>
                            {errorRate[attribute].message}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
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
                {submitButtonLabel || "UPDATE RATES"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
