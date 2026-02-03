import { useEffect, useState } from "react";
import OwnerContentPage from "./OwnerContentPage";
import LoginSignupPage from "./LoginSignupPage";
import NavigationBar from "./NavigationBar";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import OwnerManageMenus from "./OwnerManageMenus";
import OwnerSettingMenus from "./OwnerSettingMenus";
import OwnerReportMenus from "./OwnerReportMenus";
export default function OwnerMainPage() {
  let [selectedEntity, setSelectedEntity] = useState("");
  let [user, setUser] = useState("");
  let [view, setView] = useState("loginSignup");
  let [message, setMessage] = useState("");
  let [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  let [selectedEntityIndex, setSelectedEntityIndex] = useState(-1);
  let [flagCheckSession, setFlagCheckSession] = useState(false);
  let ownerMenus = [];
  ownerMenus.push(OwnerManageMenus);
  ownerMenus.push(OwnerSettingMenus);
  ownerMenus.push(OwnerReportMenus);
  useEffect(() => {
    checkSessionExists();
    
    // Listen for session expiration events from axios interceptor
    const handleSessionExpired = (event) => {
      setMessage(event.detail.message || "Your session has expired. Please login again.");
      setUser("");
      setView("loginSignup");
      setSelectedMenuIndex(-1);
      setSelectedEntityIndex(-1);
      setSelectedEntity("");
    };
    
    window.addEventListener('sessionExpired', handleSessionExpired);
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);
  async function checkSessionExists() {
    setFlagCheckSession(true);
    try {
      let response = await axios.get(
        import.meta.env.VITE_API_URL + "/api/users/hello"
      );
      response = response.data;
      setFlagCheckSession(false);
      // Check if response exists and is not a guest token
      if (!response || !response.role || response.role === "guest") {
        // No valid session or guest token - show login
        setView("loginSignup");
        setUser("");
      } else {
        // Valid logged in user
        setUser(response);
        setView("home");
        setSelectedMenuIndex(-1);
        setSelectedEntityIndex(-1);
        setSelectedEntity("");
      }
    } catch (err) {
      setFlagCheckSession(false);
      console.log(err);
      // On error, show login form
      setView("loginSignup");
      setUser("");
    }
  }
  function handleEntityClick(selectedIndex) {
    if (!user) {
      setMessage("Please log in to access this option.");
      return;
    }
    if (
      selectedEntity.name ==
      ownerMenus[selectedMenuIndex].entities[selectedIndex].name
    ) {
      setSelectedMenuIndex(-1);
      setSelectedEntityIndex(-1);
      setView("home");
      return;
    }
    setSelectedEntityIndex(selectedIndex);
    setSelectedEntity(ownerMenus[selectedMenuIndex].entities[selectedIndex]);
    setView("content");
  }
  function handleSideBarMenuClick(index) {
    if (!user) {
      setMessage("Please log in to access menu options.");
      return;
    }
    // Check if this menu is a direct action menu (like calculator)
    if (ownerMenus[index].isDirectAction) {
      const entity = ownerMenus[index].directEntity;
      if (selectedEntity && selectedEntity.name === entity.name) {
        // If already selected, close it
        setSelectedMenuIndex(-1);
        setSelectedEntityIndex(-1);
        setView("home");
        setSelectedEntity("");
      } else {
        // Open the calculator directly
        setSelectedMenuIndex(index);
        setSelectedEntityIndex(0);
        setSelectedEntity(entity);
        setView("content");
      }
      return;
    }
    // Regular menu with dropdown
    if (selectedMenuIndex == index) {
      setSelectedMenuIndex(-1);
    } else {
      setSelectedMenuIndex(index);
    }
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
  }
  function handleLogInSignupButtonClick() {
    setView("loginSignup");
  }
  function setLoggedinUser(loggedinUser) {
    setMessage(""); // Clear any session expiration messages
    setView("home");
    setUser(loggedinUser);
    setSelectedMenuIndex(-1);
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
  }
  function handleSignoutClick() {
    setUser("");
    setView("home");
    setSelectedMenuIndex(-1);
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
    // remove jwt token from backend
    axios.post(import.meta.env.VITE_API_URL + "/api/users/signout");
  }
  function handleCloseLoginSignupPageClose() {
    setView("home");
  }
  function handleBackButtonClick() {
    setView("home");
    setSelectedMenuIndex(-1);
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
  }
  if (flagCheckSession) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }
  return (
    <>
      <NavigationBar
        user={user}
        onHomeClick={handleBackButtonClick}
        onSignoutClick={handleSignoutClick}
        currentPage={view === "content" ? selectedEntity?.name : view === "home" ? "home" : null}
      />
      {message && (
        <div className="text-center bg-danger text-white w-50 mx-auto mb-2 p-1">
          {message.toUpperCase()}
        </div>
      )}
      {view === "home" && (
        <div className="homepage-container">
          <div className="homepage-card">
            {/* Header Section with Welcome and Signout */}
            {user && (
              <div className="homepage-header">
                <div className="homepage-welcome">
                  <div className="homepage-welcome-icon">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="homepage-welcome-text">
                    <h4 className="homepage-welcome-title">
                      Welcome, <span className="homepage-welcome-name">{user.name || user.emailId}</span>!
                    </h4>
                    {user.shopurl && user.role && (
                      <div className="homepage-welcome-subtitle">
                        <i className="bi bi-shop me-1"></i>
                        {user.shopurl} <span className="text-muted">({user.role})</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="homepage-signout-btn"
                  onClick={handleSignoutClick}
                  title="Sign Out"
                >
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Sign Out
                </button>
              </div>
            )}
            
            {/* Login Button for Non-logged Users */}
            {!user && (
              <div className="homepage-login-section">
                <div className="homepage-welcome-icon-large">
                  <i className="bi bi-person-circle"></i>
                </div>
                <h4 className="homepage-title mb-3">Welcome to Home Decor</h4>
                <p className="homepage-subtitle mb-4">Please login to access the dashboard</p>
                <button
                  className="homepage-login-btn"
                  onClick={handleLogInSignupButtonClick}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login / Signup
                </button>
              </div>
            )}

            {/* Menu Options */}
            {user && (
              <div className="homepage-menus">
                {ownerMenus.map((menu, menuIndex) => (
                  <div key={menuIndex} className="homepage-menu-card">
                    <button
                      className={`homepage-menu-btn ${selectedMenuIndex === menuIndex ? 'active' : ''}`}
                      onClick={() => handleSideBarMenuClick(menuIndex)}
                    >
                      <div className="homepage-menu-icon">
                        {menuIndex === 0 && <i className="bi bi-gear-fill"></i>}
                        {menuIndex === 1 && <i className="bi bi-sliders"></i>}
                        {menuIndex === 2 && <i className="bi bi-graph-up-arrow"></i>}
                      </div>
                      <span className="homepage-menu-text">{menu.name}</span>
                      <i className={`bi ${selectedMenuIndex === menuIndex ? 'bi-chevron-up' : 'bi-chevron-down'} homepage-menu-arrow`}></i>
                    </button>
                    {selectedMenuIndex === menuIndex && !menu.isDirectAction && (
                      <div className="homepage-submenu">
                        {menu.entities.map((entity, entityIndex) => (
                          <button
                            key={entityIndex}
                            className={`homepage-submenu-btn ${selectedEntityIndex === entityIndex ? 'active' : ''}`}
                            onClick={() => handleEntityClick(entityIndex)}
                          >
                            <i className="bi bi-arrow-right-circle me-2"></i>
                            {entity.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="container-fluid py-4">
        {!user && (
          <LoginSignupPage
            setLoggedinUser={setLoggedinUser}
            onCloseLoginSignupPageClose={handleCloseLoginSignupPageClose}
            onBackButtonClick={handleBackButtonClick}
            tableName="owners"
          />
        )}
        {view === "content" && (
          <OwnerContentPage
            selectedEntity={selectedEntity}
            user={user}
            onBackButtonClick={handleBackButtonClick}
          />
        )}
      </div>
    </>
  );
}
