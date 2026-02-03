import { useRef, useState } from "react";
import ModalExport from "./ModalExport";
import ExportToExcel from "../utils/ExportToExcel";
import ExportToPDF from "../utils/ExportToPDF";
// import { isExpired } from "../licenseGuard";
export default function CommonUtilityBar(props) {
  let { action } = props;
  let { message } = props;
  let { selectedEntity } = props;
  let { filteredList } = props;
  let { mainList } = props;
  let { showInList } = props;
  
  // Safety check: ensure selectedEntity exists
  if (!selectedEntity) {
    console.warn("CommonUtilityBar: selectedEntity is undefined");
    return null;
  }
  let [flagExport, setFlagExport] = useState(false);
  const buttonBRef = useRef(null);
  function handleListClick() {
    props.onListClick();
  }
  function handleAddEntityClick() {
    props.onAddEntityClick();
  }
  function handleSearchKeyUp(event) {
    props.onSearchKeyUp(event);
  }

  function handleClearSearch() {
    console.log("Aai");
    
    // Create a synthetic event to clear the search
    const clearEvent = {
      target: { value: "" }
    };
    // Call onSearchKeyUp which handles both state update and search operation
    // This matches the pattern used in AdminEnquiries and AdminMeasurements
    if (props.onSearchKeyUp) {
      props.onSearchKeyUp(clearEvent);
    }
  }
  function handleExportButtonClick(columnSize, exportFileType) {
    //close the modal
    setFlagExport(false);
    // Prepare list for export. exclude image-names, addDate and updateDate.
    let fieldsToBeExported = showInList
      .filter(
        (e) =>
          e.type != "singleFile" &&
          ((e.show && columnSize == "selected") || columnSize == "all")
      )
      .map((e) => e.attribute);

    if (exportFileType == "excel") {
      fieldsToBeExported.unshift("_id");
    }
    // Helper function to format products array as readable string, grouped by place
    function formatProductsForExport(products) {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return "";
      }
      
      // Group products by place
      const groupedByPlace = {};
      products.forEach((product) => {
        const place = product.place || "Unspecified";
        if (!groupedByPlace[place]) {
          groupedByPlace[place] = [];
        }
        groupedByPlace[place].push(product);
      });
      
      // Sort places alphabetically (or keep original order)
      const sortedPlaces = Object.keys(groupedByPlace).sort();
      
      // Format products placewise
      const formattedSections = sortedPlaces.map((place) => {
        const placeProducts = groupedByPlace[place];
        const placeHeader = `--- ${place} ---`;
        const productLines = placeProducts.map((product) => {
          let parts = [];
          if (product.productName) parts.push(product.productName);
          
          let dimensions = [];
          if (product.height !== undefined && product.height !== "") dimensions.push(`H:${product.height}`);
          if (product.width !== undefined && product.width !== "") dimensions.push(`W:${product.width}`);
          if (product.length !== undefined && product.length !== "") dimensions.push(`L:${product.length}`);
          
          if (dimensions.length > 0) {
            parts.push(`(${dimensions.join(", ")})`);
          }
          
          return parts.join(" ");
        });
        
        return [placeHeader, ...productLines].join("\n");
      });
      
      return formattedSections.join("\n\n");
    }

    let exportList = filteredList.map((e, index) => {
      let obj = {};
      // Iterate through fieldsToBeExported in order to preserve column order
      for (let key of fieldsToBeExported) {
        if (e.hasOwnProperty(key) || key === "_id") {
          // Format products array as readable string
          if (key === "products" && Array.isArray(e[key])) {
            obj[key] = formatProductsForExport(e[key]);
          } else {
            obj[key] = e[key];
          }
        }
      } //for
      return obj;
    });
    // _id is also required
    if (exportFileType == "excel") {
      handleExcelExportClick(exportList);
    } else if (exportFileType == "pdf") {
      handlePDFExportClick(fieldsToBeExported, exportList);
    }
  }
  function handleExcelExportClick(exportList) {
    let dt = new Date();
    var fileName =
      selectedEntity.name + dt.toDateString() + " " + dt.toLocaleTimeString();
    ExportToExcel(exportList, fileName);
  }
  function handlePDFExportClick(fieldsToBeExported, exportList) {
    let dt = new Date();
    var fileName =
      selectedEntity.name + dt.toDateString() + " " + dt.toLocaleTimeString();
    ExportToPDF(selectedEntity.name, fieldsToBeExported, exportList, fileName);
  }

  function handleExportClick() {
    setFlagExport(true);
  }
  function handleModalCloseClick() {
    setFlagExport(false);
  }

  function handleUploadExcelSheetClick() {
    if (buttonBRef.current) {
      props.onClearSelectedFile();
      buttonBRef.current.click(); // trigger Button B click
    }
  }
  function fileChangedHandler(e) {
    let file = e.target.files[0];
    console.log("..." + file);
    if (buttonBRef.current) {
      buttonBRef.current.value = "";
    }

    if (!file) {
      return;
    }
    // image/jpeg, image/png, application/pdf, video/mp4,
    //application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    if (
      file.type.indexOf("csv") == -1 &&
      file.type.indexOf("spreadsheet") == -1
    ) {
      props.onExcelFileUploadClick(null, "The file-type should be excel");
    } else {
      // setSelectedFile(file);
      props.onExcelFileUploadClick(file, "");
    }
  }
  // if (isExpired()) {
  //   return null;
  // }
  return (
    <>
      <div className="compact-header">
        <div className="d-flex align-items-center justify-content-end justify-content-md-center mb-1">
          {action == "list" && selectedEntity.addFacility && (
            <div className="d-flex gap-2">
              <button
                className="action-btn action-btn-add"
                onClick={handleAddEntityClick}
                title="Add new"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
              <button
                className="action-btn action-btn-import"
                onClick={handleUploadExcelSheetClick}
                title="Import Excel"
              >
                <i className="bi bi-upload"></i>
              </button>
            </div>
          )}
        </div>
        <div className="text-muted small mb-2">
          {action == "add"
            ? "Add a new record"
            : action == "update"
            ? "Update existing record"
            : `${filteredList.length} record${filteredList.length !== 1 ? "s" : ""} found`}
        </div>
        <div>
          <input
            className=""
            type="file"
            name="selectedFile"
            ref={buttonBRef}
            onChange={fileChangedHandler}
            style={{ opacity: 0, position: "absolute", zIndex: -1 }}
          />
        </div>
        {action == "list" && (
          <div
            className={
              "row mx-auto justify-content-center text-start py-1 align-items-center border-top border-1 border-primary"
            }
          >
            {(mainList.length != 0 || (props.searchText && props.searchText.trim().length > 0)) && (
              <div className="col-8 col-md-6 text-center">
                <div className="search-input-wrapper">
                  {/* <i className="bi bi-search search-input-icon"></i> */}
                  <input
                    type="text"
                    name=""
                    id=""
                    value={props.searchText || ""}
                    onKeyUp={handleSearchKeyUp}
                    onChange={props.onSearchChange || handleSearchKeyUp}
                    className="form-control search-input"
                    placeholder="Search here..."
                  />
                  {props.searchText && props.searchText.trim().length > 0 && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={handleClearSearch}
                      title="Clear search"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
            {mainList.length != 0 && (
              <>
                <div className="col-2 col-md-3 text-center">
                  <button 
                    className="action-btn action-btn-fields" 
                    onClick={props.onFieldSelectorClick} 
                    title="Select Fields"
                  >
                    <i className="bi bi-list-check"></i>
                  </button>
                </div>
                <div className="col-2 col-md-3 text-center">
                  <button className="action-btn action-btn-export" onClick={handleExportClick} title="Export">
                    <i className="bi bi-download"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {message && (
          <div className="alert alert-warning py-1 px-3 my-1 mx-auto text-center rounded-pill shadow-sm small message-banner">
            {message}
          </div>
        )}
        {flagExport && (
          <ModalExport
            modalText={'Do you really want to delete data of  "'}
            btnGroup={["Yes", "No"]}
            onModalCloseClick={handleModalCloseClick}
            onModalButtonCancelClick={handleModalCloseClick}
            onExportButtonClick={handleExportButtonClick}
          />
        )}
      </div>
    </>
  );
}
