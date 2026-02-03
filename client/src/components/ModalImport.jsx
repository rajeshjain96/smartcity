import { useEffect, useState } from "react";
export default function ModalImport(props) {
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "scroll";
    };
  }, []);

  let { additions } = props;
  let { updations } = props;
  function handleModalCloseClick() {
    props.onModalCloseClick();
  }

  function handleModalButtonCancelClick() {
    props.onModalButtonCancelClick();
  }
  function handleImportButtonClick() {
    props.onImportButtonClick( );
  }
  function handleColumnSizeSelection(columnSize) {
    setColumnSize(columnSize);
    // props.onColumnSizeSelection(columnSize);
  }
  function handleFileTypeSelectionChange(event) {
    setExportFileType(event.target.value);
  }
  return (
    <>
      <div className="modal-wrapper" onClick={handleModalCloseClick}></div>
      <div className="modal-container   ">
        <div className="text-bigger d-flex justify-content-between bg-primary text-white mb-3 p-2">
          {" "}
          <div>File Import</div>{" "}
          <div onClick={handleModalCloseClick}>
            <i className="bi bi-x-square"></i>
          </div>
        </div>
        <div className="text-center my-3">Additions : {additions.length}</div>
        <div className="text-center ">Updations : {updations.length}</div>
        {/* <hr /> */}

        {/* <hr /> */}
        <div className="text-center my-5">
          {/* <button onClick={handleModalCloseClick}>Close</button> */}

          <button
            className="btn btn-primary mx-1"
            onClick={handleImportButtonClick}
          >
            Import Data
          </button>
          <button
            className="btn btn-primary mx-1"
            onClick={handleModalButtonCancelClick}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
