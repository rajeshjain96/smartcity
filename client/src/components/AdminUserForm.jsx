import { useEffect, useState } from "react";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";
import formLayout from "./FormLayout";

export default function AdminUserForm(props) {
  let fl = formLayout();
  let cardStyle = fl.cardStyle;
  let cols = fl.cols;
  let [user, setUser] = useState("");
  let [errorUser, setErrorUser] = useState(props.userValidations);
  let [flagFormInvalid, setFlagFormInvalid] = useState(false);
  let [hasValidated, setHasValidated] = useState(false);
  let { emptyUser } = props;
  let { userToBeEdited } = props;
  let { action } = props;
  let { selectedEntity } = props;
  let { userSchema } = props;
  
  useEffect(() => {
    window.scroll(0, 0);
    init();
  }, []);

  function init() {
    let { action } = props;
    if (action === "add") {
      let initialUser = { ...props.emptyUser };
      initialUser.role = "resident";
      initialUser.status = "active";
      setUser(initialUser);
      setHasValidated(false);
    } else if (action === "update") {
      setFlagFormInvalid(false);
      const missing = Object.keys(emptyUser).filter(
        (key) => !Object.keys(userToBeEdited).includes(key)
      );
      missing.forEach((key) => {
        userToBeEdited[key] = "";
      });
      setUser(props.userToBeEdited);
    }
  }

  function handleTextFieldChange(event) {
    let name = event.target.name;
    setUser({ ...user, [name]: event.target.value });
    let message = fieldValidate(event, errorUser);
    let errUser = { ...errorUser };
    if (errorUser[`${name}`]) {
      errorUser[`${name}`].message = message;
    }
    setErrorUser(errUser);
  }

  function handleBlur(event) {
    let name = event.target.name;
    let message = fieldValidate(event, errorUser);
    let errUser = { ...errorUser };
    if (errorUser[`${name}`]) {
      errorUser[`${name}`].message = message;
    }
    setErrorUser(errUser);
  }

  function handleFocus(event) {
    setFlagFormInvalid(false);
  }

  function handleRoleChange(event) {
    setUser({ ...user, role: event.target.value });
  }

  function handleStatusChange(event) {
    setUser({ ...user, status: event.target.value });
  }

  function checkAllErrors() {
    let errUser = { ...errorUser };
    let flag = false;
    
    // First, clear "Required..." messages for fields that now have values
    // Required fields: name, emailId, role, status
    const requiredFields = ["name", "emailId", "role", "status"];
    for (let field of requiredFields) {
      if (errUser[field]) {
        if (!user[field] || user[field] === "") {
          // Field is empty - mark as required
          errUser[field].message = "Required...";
          flag = true;
        } else {
          // Field has value - clear the "Required..." error if that's the only error
          if (errUser[field].message === "Required...") {
            errUser[field].message = "";
          }
        }
      }
    }
    
    // Now check for any remaining validation errors (length, format, etc.)
    for (let field in errUser) {
      if (errUser[field] && errUser[field].message !== "") {
        flag = true;
      }
    }
    
    if (flag) {
      setErrorUser(errUser);
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
    props.onFormSubmit(user);
  };

  return (
    <div className="customer-form-wrapper my-3">
      <form className="text-thick p-4" onSubmit={handleFormSubmit}>
        <div className={`${cardStyle} customer-form-card`}>
          <div className="col-12 mb-3 customer-form-header">
            <h5 className="customer-form-title mb-1 text-primarycolor">
              {action === "add" ? "Add new user" : "Update user"}
            </h5>
            <p className="customer-form-subtitle mb-0">
              {action === "add" 
                ? "Create user account. A random password will be generated and emailed to the user."
                : "Update user information and permissions."}
            </p>
          </div>

          {/* Name */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Full Name *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-person"></i>
                </span>
                <input
                  type="text"
                  className="form-control customer-input"
                  name="name"
                  value={user.name || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter full name"
                />
              </div>
            </div>
            <div className="">
              {errorUser.name && errorUser.name.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorUser.name.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Email */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Email Address *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control customer-input"
                  name="emailId"
                  value={user.emailId || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter email address"
                  disabled={action === "update"}
                />
              </div>
            </div>
            <div className="">
              {errorUser.emailId && errorUser.emailId.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorUser.emailId.message}
                </span>
              ) : (
                action === "update" && (
                  <small className="text-muted">Email cannot be changed</small>
                )
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Mobile Number</label>
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
                  value={user.mobileNumber || ""}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  placeholder="Enter mobile number (optional)"
                />
              </div>
            </div>
            <div className="">
              {errorUser.mobileNumber && errorUser.mobileNumber.message ? (
                <span className="form-error-message">
                  <i className="bi bi-exclamation-circle"></i>
                  {errorUser.mobileNumber.message}
                </span>
              ) : null}
            </div>
          </div>

          {/* Role */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Role *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-shield-check"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="role"
                  value={user.role || "resident"}
                  onChange={handleRoleChange}
                >
                  <option value="admin">Admin</option>
                  <option value="driver">Driver</option>
                  <option value="resident">Resident</option>
                </select>
              </div>
            </div>
            <div className="">
              <small className="text-muted">
                {user.role === "admin" && "Full system access"}
                {user.role === "driver" && "Can update dustbin status and view assignments"}
                {user.role === "resident" && "Read-only access to public information"}
              </small>
            </div>
          </div>

          {/* Status */}
          <div className={cols + " my-2"}>
            <div className="text-bold my-1">
              <label className="form-label fw-semibold">Account Status *</label>
            </div>
            <div className="px-0">
              <div className="input-group input-group-lg customer-input-group">
                <span className="input-group-text customer-input-icon">
                  <i className="bi bi-toggle-on"></i>
                </span>
                <select
                  className="form-control customer-input"
                  name="status"
                  value={user.status || "active"}
                  onChange={handleStatusChange}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="">
              <small className="text-muted">
                {user.status === "active" 
                  ? "User can login and access the system"
                  : "User is blocked from logging in"}
              </small>
            </div>
          </div>

          {/* Password Info (Add mode only) */}
          {action === "add" && (
            <div className="col-12 my-3">
              <div className="alert alert-info d-flex align-items-center" role="alert">
                <i className="bi bi-info-circle-fill me-2"></i>
                <div>
                  <strong>Password Generation:</strong> A random 6-digit password will be automatically 
                  generated and sent to the user's email address.
                </div>
              </div>
            </div>
          )}

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
