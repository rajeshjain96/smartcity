import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminCatalogForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [catalog, setCatalog] = useState("");
  let [errorCatalog, setErrorCatalog] = useState(props.catalogValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyCatalog } = props;
  let { catalogToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { catalogSchema } = props;
  let { companyList } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromCatalogSchema()
  );
  function getSingleFileListFromCatalogSchema() {
    let list = [];
    if (!catalogSchema || !Array.isArray(catalogSchema)) {
      return list;
    }
    catalogSchema.forEach((e, index) => {
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
    if (catalogSchema) {
      setSingleFileList(getSingleFileListFromCatalogSchema());
    }
  }, [catalogSchema]);
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  
  // Fix companyId for Excel-imported catalogs when companyList becomes available
  useEffect(() => {
    if (action === "update" && catalog && catalog.company && !catalog.companyId && 
        companyList && companyList.length > 0) {
      const matchingCompany = companyList.find(
        c => c.name && catalog.company && 
        c.name.trim().toLowerCase() === catalog.company.trim().toLowerCase()
      );
      if (matchingCompany && matchingCompany._id) {
        // Update the catalog state with the found companyId
        setCatalog(prevCatalog => ({ ...prevCatalog, companyId: matchingCompany._id }));
        // Clear any error messages for company/companyId
        setErrorCatalog(prevErrors => {
          let errCatalog = { ...prevErrors };
          errCatalog.company.message = "";
          errCatalog.companyId.message = "";
          return errCatalog;
        });
      }
    }
  }, [companyList, action]);
  function init() {
    let { action } = props;
    if (action === "add") {
      setCatalog(props.emptyCatalog);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyCatalog).filter(
        (key) => !Object.keys(catalogToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        catalogToBeEdited[key] = "";
      });
      
      // Fix for Excel-imported catalogs: if company name exists but companyId is missing,
      // find the companyId from companyList
      if (catalogToBeEdited.company && !catalogToBeEdited.companyId && companyList && companyList.length > 0) {
        const matchingCompany = companyList.find(
          c => c.name && catalogToBeEdited.company && 
          c.name.trim().toLowerCase() === catalogToBeEdited.company.trim().toLowerCase()
        );
        if (matchingCompany && matchingCompany._id) {
          catalogToBeEdited.companyId = matchingCompany._id;
        }
      }
      
      setCatalog(props.catalogToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setCatalog({ ...catalog, [name]: event.target.value });
    let message = fieldValidate(event, errorCatalog);
    let errCatalog = { ...errorCatalog };
    errorCatalog[`${name}`].message = message;
    setErrorCatalog(errCatalog);
  }
  function handleBlur(event) {
    let name = event.target.name;
    // Round priceInRs to integer to avoid floating-point precision issues
    if (name === "priceInRs" && event.target.value !== "") {
      const numValue = parseFloat(event.target.value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue);
        setCatalog({ ...catalog, [name]: roundedValue });
        // Update the event target value for validation
        event.target.value = roundedValue;
      }
    }
    let message = fieldValidate(event, errorCatalog);
    let errCatalog = { ...errorCatalog };
    errorCatalog[`${name}`].message = message;
    setErrorCatalog(errCatalog);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function handleCompanyChange(e) {
    const selectedIndex = e.target.selectedIndex;
    const selectedOption = e.target.options[selectedIndex];
    const companyId = selectedOption.id;
    const companyValue = selectedOption.value;
    setCatalog({ ...catalog, company: companyValue, companyId: companyId });
    let errCatalog = { ...errorCatalog };
    errorCatalog.company.message = "";
    errorCatalog.companyId.message = "";
    setErrorCatalog(errCatalog);
  }
  function checkAllErrors() {
    for (let field in errorCatalog) {
      if (errorCatalog[field].message !== "") {
        return true;
      }
    }
    let errCatalog = { ...errorCatalog };
    let flag = false;
    for (let field in catalog) {
      // Skip company field as it's relational - check companyId instead
      if (field === "company") {
        if (!catalog.companyId || catalog.companyId === "") {
          flag = true;
          errCatalog.company.message = "Company is required";
        }
        continue;
      }
      if (errorCatalog[field] && catalog[field] == "") {
        flag = true;
        errCatalog[field].message = "Required...";
      }
    }
    if (flag) {
      setErrorCatalog(errCatalog);
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
      let pr = { ...catalog };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      }
      setCatalog(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(catalog);
    }
  };
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new catalog" : "Update catalog"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage catalog information with company details and pricing.
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Company</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-building"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="company"
                  value={catalog.company || ""}
                  onChange={handleCompanyChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                >
                  <option value="">-- Select Company --</option>
                  {companyList && companyList.map((company, index) => (
                    <option value={company.name} key={index} id={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="">
              {errorCatalog.company?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCatalog.company.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-hash"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="name"
                  value={catalog.name || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter catalog name"
                />
              </div>
            </div>
            <div className="">
              {errorCatalog.name?.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCatalog.name.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Price in Rs (per meter)</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-currency-rupee"></i>
                </span>
                <input
                  type="number"
                  className="form-control customer-input"
                  name="priceInRs"
                  value={catalog.priceInRs || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter price per meter in rupees"
                  step="1"
                  min="0"
                />
              </div>
            </div>
            <div className="">
              {errorCatalog.priceInRs.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCatalog.priceInRs.message}
                </span>
              ) : null}
            </div>
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
                {(action + " " + selectedEntity.singularName).toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

