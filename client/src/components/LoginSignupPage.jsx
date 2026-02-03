// import axios from "axios";
import axios from "./AxiosInstance";
import { useState } from "react";

export default function LoginSignupPage(props) {
  let emptyForm = {
    name: "",
    emailId: "",
    password: "",
    confirmPassword: "",
  };
  const [formData, setFormData] = useState(emptyForm);
  let [message, setMessage] = useState("");
  let [status, setStatus] = useState("checkEmail");
  const [formType, setFormType] = useState("login");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  let { tableName } = props;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.emailId) newErrors.emailId = "Email is required";
    if (formType === "signup" && !formData.name)
      newErrors.name = "Name is required";
    if ((formType === "login" || formType === "signup") && !formData.password) {
      newErrors.password = "Password is required";
    }
    if (
      formType === "signup" &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  async function handleSignupFormSubmit(e) {
    // remove confirmPassword field
    delete formData.confirmPassword;
    try {
      let response = await axios.post("/" + tableName + "/signup", formData);
      setSignupSuccess(true);  // 
      setMessage("Signup successful, you may login now");  // Change the message
      setFormData(emptyForm);
    } catch (error) {
      //try
      if (error.response) {
        // Backend responded with 4xx or 5xx
        showMessage(error.response.data.error);
      } else if (error.request) {
        showMessage("No response from server");
      } else {
        // Something else went wrong
        showMessage("Unexpected error occurred");
      }
    }
  }
  async function handleLoginFormSubmit(e) {
    try {
      let response = await axios.post("/" + tableName + "/login", formData);
      showMessage(response.data.message);
      props.setLoggedinUser(response.data.user);
    } catch (error) {
      console.log(error.response.data);
      if (error.response) {
        // Backend responded with 4xx or 5xx
        showMessage(error.response.data.error);
      } else if (error.request) {
        showMessage("No response from server");
      } else {
        // Something else went wrong
        showMessage("Unexpected error occurred");
      }
    }
  }
  function showMessage(m) {
    setMessage(m);
    window.setTimeout(() => {
      setMessage("");
    }, 5000);
  }
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;
    // console.log(formData);
    if (formType == "signup") {
      // check whether user is added by the admin or not.
      handleSignupFormSubmit(e);
    } else if (formType === "login") {
      handleLoginFormSubmit(e);
    }
  };
  function handleCloseLoginSignupPageClose() {
    props.onCloseLoginSignupPageClose();
  }
  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-page-overlay"
        onClick={handleCloseLoginSignupPageClose}
      />
      <div className="auth-card-mobile">
        <button
          type="button"
          className="auth-close-btn auth-close-btn-floating"
          onClick={handleCloseLoginSignupPageClose}
        >
          ×
        </button>

        <div className="auth-logo">Smart City</div>
        <div className="auth-logo">Garbage Collection</div>

        <div className="auth-header text-center my-4">
          <h3 className="auth-title mb-1">
            {formType === "login"
              ? "Login to your account"
              : "Create your account"}
          </h3>
          <p className="auth-caption mb-0">
            {formType === "login"
              ? "Welcome back, we missed you."
              : "Join us to start designing your perfect space."}
          </p>
        </div>

        <ul className="nav nav-tabs auth-tabs mb-4" role="tablist">
          <li className="nav-item flex-fill text-center">
            <button
              type="button"
              className={`nav-link w-100 ${
                formType === "login" ? "active" : ""
              }`}
              onClick={() => {
                setFormType("login");
                setMessage("");  // Clear the success message
                setSignupSuccess(false);  // Reset signup success state
              }}
            >
              Login
            </button>
          </li>
          <li className="nav-item flex-fill text-center">
            <button
              type="button"
              className={`nav-link w-100 ${
                formType === "signup" ? "active" : ""
              }`}
              onClick={() => {
                setFormType("signup");
                setSignupSuccess(false);  // Reset signup success state
                setMessage("");  // Clear any messages
                setFormData({
                  ...formData,
                  password: "",
                  confirmPassword: "",
                });
                setShowPassword(false);
                setShowConfirmPassword(false);
              }}
            >
              Signup
            </button>
          </li>
        </ul>

        {message && (
          <div className="alert alert-warning py-2 small auth-message mb-3">
            {message}
          </div>
        )}

        {formType === "login" && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
              <label className="form-label auth-label">Email</label>
              <input
                name="emailId"
                type="email"
                className="form-control auth-input"
                placeholder="Email"
                onChange={handleChange}
              />
              {errors.emailId && (
                <div className="text-danger mt-1 small">{errors.emailId}</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label auth-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="Password"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="text-danger mt-1 small">{errors.password}</div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-darkcolor w-100 auth-submit auth-primary-btn"
            >
              Sign in
            </button>
          </form>
        )}

        {formType === "signup" && !signupSuccess && (  
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="mb-3">
              <label className="form-label auth-label">Full name</label>
              <input
                name="name"
                type="text"
                className="form-control auth-input"
                placeholder="Your name"
                onChange={handleChange}
              />
              {errors.name && (
                <div className="text-danger mt-1 small">{errors.name}</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label auth-label">Email</label>
              <input
                name="emailId"
                type="email"
                className="form-control auth-input"
                placeholder="Email"
                onChange={handleChange}
              />
              {errors.emailId && (
                <div className="text-danger mt-1 small">{errors.emailId}</div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label auth-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="Password"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="text-danger mt-1 small">{errors.password}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label auth-label">Confirm password</label>
              <div className="password-input-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control auth-input"
                  placeholder="Confirm Password"
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="text-danger mt-1 small">
                  {errors.confirmPassword}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-darkcolor w-100 auth-submit auth-primary-btn"
            >
              Sign up
            </button>
          </form>
        )}
{formType === "signup" && signupSuccess && (
  <div className="text-center py-4">
    {/* <div className="alert alert-success mb-3">
      Signup successful, you may login now
    </div> */}
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => {
        setSignupSuccess(false);
        setFormType("login");
        setMessage("");  // Clear the success message
      }}
    >
      Go to Login
    </button>
  </div>
)}
        <div className="auth-footer text-center mt-4">
          {formType === "login" ? (
            <p className="mb-0 auth-caption">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => {
                  setFormType("signup");
                  setSignupSuccess(false);  // Reset signup success state
                  setMessage("");  // Clear any messages
                }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="mb-0 auth-caption">
              Already have an account?{" "}
              <button
                type="button"
                className="auth-footer-link"
                onClick={() => {
                  setFormType("login");
                  setMessage("");  // Clear the success message
                  setSignupSuccess(false);  // Reset signup success state
                }}
              >
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
