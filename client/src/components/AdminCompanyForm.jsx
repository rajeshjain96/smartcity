import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminCompanyForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [company, setCompany] = useState("");
  let [errorCompany, setErrorCompany] = useState(props.companyValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyCompany } = props;
  let { companyToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { companySchema } = props;
  let [singleFileList, setSingleFileList] = useState(
    getSingleFileListFromCompanySchema()
  );
  function getSingleFileListFromCompanySchema() {
    let list = [];
    if (!companySchema || !Array.isArray(companySchema)) {
      return list;
    }
    companySchema.forEach((e, index) => {
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
    if (companySchema) {
      setSingleFileList(getSingleFileListFromCompanySchema());
    }
  }, [companySchema]);
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);
  function init() {
    let { action } = props;
    if (action === "add") {
      setCompany(props.emptyCompany);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyCompany).filter(
        (key) => !Object.keys(companyToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        companyToBeEdited[key] = "";
      });
      setCompany(props.companyToBeEdited);
    }
  }
  function handleTextFieldChange(event) {
    let name = event.target.name;
    setCompany({ ...company, [name]: event.target.value });
    let message = fieldValidate(event, errorCompany);
    let errCompany = { ...errorCompany };
    errorCompany[`${name}`].message = message;
    setErrorCompany(errCompany);
  }
  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorCompany);
    let errCompany = { ...errorCompany };
    errorCompany[`${name}`].message = message;
    setErrorCompany(errCompany);
  }
  function handleFocus(event) {
    setFlagFormInvalid(false);
  }
  function checkAllErrors() {
    for (let field in errorCompany) {
      if (errorCompany[field].message !== "") {
        return true;
      }
    }
    let errCompany = { ...errorCompany };
    let flag = false;
    for (let field in company) {
      // Skip description field as it's optional
      if (field === "description") {
        continue;
      }
      if (errorCompany[field] && company[field] == "") {
        flag = true;
        errCompany[field].message = "Required...";
      }
    }
    if (flag) {
      setErrorCompany(errCompany);
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
      let pr = { ...company };
      for (let i = 0; i < singleFileList.length; i++) {
        let fAName = singleFileList[i].fileAttributeName;
        if (pr[fAName + "New"]) {
          pr[fAName] = pr[fAName + "New"];
          delete pr[fAName + "New"];
        }
      }
      setCompany(pr);
      props.onFormSubmit(pr);
    } else if (action == "add") {
      props.onFormSubmit(company);
    }
  };
  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new company" : "Update company"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              Manage company information and details.
            </p>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Name</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-building"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="name"
                  value={company.name || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter company name"
                />
              </div>
            </div>
            <div className="">
              {errorCompany.name.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCompany.name.message}
                </span>
              ) : null}
            </div>
          </div>

          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Description</label>
            </div>
            <div className="px-0">
              <div className="customer-textarea-wrapper">
                <textarea
                  className="form-control customer-input customer-textarea"
                  name="description"
                  rows={4}
                  value={company.description || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <div className="">
              {errorCompany.description.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorCompany.description.message}
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

