// import { isExpired } from "../licenseGuard";
import { useState, useEffect } from "react";
export default function CheckBoxHeaders(props) {
  let { showInList } = props;
  let { cntShow } = props;
  let { showModal } = props;
  let { onModalClose } = props;
  
  const [isOpen, setIsOpen] = useState(showModal || false);
  
  useEffect(() => {
    if (showModal !== undefined) {
      setIsOpen(showModal);
    }
  }, [showModal]);
  
  function handleListCheckBoxClick(checked, selectedIndex) {
    props.onListCheckBoxClick(checked, selectedIndex);
  }
  
  function handleSelectClick(selectedIndex) {
    props.onSelectClick(selectedIndex);
  }
  
  function handleClose() {
    setIsOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  }
  
  function handleBackdropClick(e) {
    // Close when clicking the backdrop
    handleClose();
  }
  
  function handleModalContentClick(e) {
    // Prevent clicks inside modal from bubbling to backdrop
    e.stopPropagation();
  }
  
  // If showModal prop is provided, use modal mode; otherwise use inline mode for backward compatibility
  const useModal = showModal !== undefined;
  
  return (
    <>
      {/* Modal for Field Selection */}
      {useModal && isOpen && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={handleModalContentClick}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-list-check me-2"></i>
                    Choose Fields to Display
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleClose}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <p className="text-muted small mb-3">
                      Select which fields you want to display in the list. 
                      <br />
                      <span className="text-info">
                        <i className="bi bi-info-circle me-1"></i>
                        Minimum 2 fields and maximum {window.maxCnt || 2} fields can be selected.
                      </span>
                    </p>
                  </div>
                  
                  {/* Field Pills */}
                  <div className="field-selector-pills-modal">
                    {showInList.map((field, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`field-pill ${field.show ? "field-pill-active" : "field-pill-inactive"}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleListCheckBoxClick(!field.show, index);
                        }}
                        title={field.show ? "Click to hide" : "Click to show"}
                      >
                        {field.show && <i className="bi bi-check-circle-fill me-1"></i>}
                        {field.label || field.attribute.charAt(0).toUpperCase() + field.attribute.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Selected Fields Summary */}
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted d-block mb-2">
                      <strong>Selected ({cntShow}):</strong>
                    </small>
                    <div>
                      {showInList
                        .filter((e) => e.show)
                        .map((e, index) => (
                          <span key={index} className="badge bg-primary me-1 mb-1">
                            {e.attribute}
                          </span>
                        ))}
                      {cntShow === 0 && (
                        <span className="text-muted small">No fields selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={handleBackdropClick}></div>
        </>
      )}
      
      {/* Inline mode for backward compatibility (when showModal is not provided) */}
      {!useModal && (
        <>
          {/* Desktop View - Pill-style toggles */}
          <div className="d-none d-md-block mb-2">
            <div className="field-selector-container">
              <span className="field-selector-label">Display fields:</span>
              <div className="field-selector-pills">
                {showInList.map((e, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`field-pill ${e.show ? "field-pill-active" : "field-pill-inactive"}`}
                    onClick={() => {
                      handleListCheckBoxClick(!e.show, index);
                    }}
                    title=                    {e.show ? "Click to hide" : "Click to show"}
                  >
                    {e.show && <i className="bi bi-check-circle-fill me-1"></i>}
                    {e.label || e.attribute.charAt(0).toUpperCase() + e.attribute.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* --- MOBILE VIEW --- */}
          <div className="d-block d-md-none mb-2">
            <label className="form-label small text-muted mb-1">Display fields:</label>
            <select
              className="form-select form-select-sm"
              value=""
              onChange={
                (e) => handleSelectClick(e.target.selectedIndex-1)
              }
            >
              <option value="" disabled>
                Choose fields to be displayed...
              </option>
              {showInList.map((e, index) => (
                <option key={index} value={index}>
                  {e.attribute}
                  {e.show ? " ✓" : ""}
                </option>
              ))}
            </select>

            {/* Helper to show what is selected on mobile */}
            <div className="mt-2">
              {showInList.map((e, index) =>
                e.show ? (
                  <span key={index} className="badge bg-primary me-1 mb-1">
                    {e.attribute}
                  </span>
                ) : (
                  ""
                )
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
