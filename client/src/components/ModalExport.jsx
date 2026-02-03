import { useEffect, useState } from "react";
export default function ModalExport(props) {
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "scroll";
    };
  }, []);
  let [columnSize, setColumnSize] = useState("all");
  let [exportFileType, setExportFileType] = useState("excel");
  function handleModalCloseClick() {
    props.onModalCloseClick();
  }

  function handleModalButtonCancelClick() {
    props.onModalButtonCancelClick();
  }
  function handleExportButtonClick() {
    props.onExportButtonClick(columnSize, exportFileType);
  }
  function handleColumnSizeSelection(columnSize) {
    setColumnSize(columnSize);
  }
  function handleFileTypeSelectionChange(event) {
    setExportFileType(event.target.value);
  }
  return (
    <>
      <div className="modal-wrapper" onClick={handleModalCloseClick}></div>
      <div className="modal-container export-modal-container">
        {/* Header */}
        <div className="export-modal-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-download fs-5"></i>
            <h5 className="mb-0 fw-semibold">Export Data</h5>
          </div>
          <button
            type="button"
            className="btn-close-modal"
            onClick={handleModalCloseClick}
            title="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="export-modal-body">
          {/* Column Selection */}
          <div className="export-option-section">
            <label className="export-section-label">
              <i className="bi bi-list-columns me-2"></i>
              Column Selection
            </label>
            <div className="export-radio-group">
              <label
                className={`export-radio-option ${
                  columnSize === "all" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="columnSize"
                  checked={columnSize === "all"}
                  onChange={() => handleColumnSizeSelection("all")}
                  className="d-none"
                />
                <div className="export-radio-content">
                  <i className="bi bi-table fs-4 mb-2"></i>
                  <span className="fw-semibold">All Columns</span>
                  <small className="text-muted">Export all available fields</small>
                </div>
              </label>
              <label
                className={`export-radio-option ${
                  columnSize === "selected" ? "active" : ""
                }`}
              >
                <input
                  type="radio"
                  name="columnSize"
                  checked={columnSize === "selected"}
                  onChange={() => handleColumnSizeSelection("selected")}
                  className="d-none"
                />
                <div className="export-radio-content">
                  <i className="bi bi-list-check fs-4 mb-2"></i>
                  <span className="fw-semibold">Selected Columns</span>
                  <small className="text-muted">Export only visible fields</small>
                </div>
              </label>
            </div>
          </div>

          {/* File Type Selection */}
          <div className="export-option-section">
            <label className="export-section-label">
              <i className="bi bi-file-earmark me-2"></i>
              File Format
            </label>
            <div className="export-select-wrapper">
              <select
                name="exportType"
                className="export-select"
                value={exportFileType}
                onChange={handleFileTypeSelectionChange}
              >
                <option value="excel">
                  <i className="bi bi-file-earmark-excel"></i> Excel (.xlsx)
                </option>
                <option value="pdf">
                  <i className="bi bi-file-earmark-pdf"></i> PDF (.pdf)
                </option>
              </select>
              <i className="bi bi-chevron-down export-select-icon"></i>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="export-modal-footer">
          <button
            className="btn btn-outline-secondary"
            onClick={handleModalButtonCancelClick}
          >
            <i className="bi bi-x-circle me-2"></i>Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExportButtonClick}
          >
            <i className="bi bi-download me-2"></i>Export
          </button>
        </div>
      </div>
    </>
  );
}
