import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminContentPage from "./AdminContentPage";
import LoginSignupPage from "./LoginSignupPage";
import NavigationBar from "./NavigationBar";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import AdminManageMenus from "./AdminManageMenus";
import AdminOperationsMenus from "./AdminOperationsMenus";
import AdminSettingMenus from "./AdminSettingMenus";
import AdminReportMenus from "./AdminReportMenus";
export default function AdminMainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  let [selectedEntity, setSelectedEntity] = useState("");
  let [user, setUser] = useState("");
  let [view, setView] = useState("loginSignup");
  let [message, setMessage] = useState("");
  let [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  let [selectedEntityIndex, setSelectedEntityIndex] = useState(-1);
  let [flagCheckSession, setFlagCheckSession] = useState(false);
  let [menuStateRestored, setMenuStateRestored] = useState(false);
  let adminMenus = [];
  adminMenus.push(AdminManageMenus);
  adminMenus.push(AdminOperationsMenus);
  adminMenus.push(AdminReportMenus);
  adminMenus.push(AdminSettingMenus);
  useEffect(() => {
    checkSessionExists();

    // Restore selectedMenuIndex from sessionStorage when component mounts
    const savedMenuIndex = sessionStorage.getItem('selectedMenuIndex');
    if (savedMenuIndex !== null) {
      const menuIndex = parseInt(savedMenuIndex, 10);
      // Only restore if it's Manage (0) or Settings (1) menu
      if (menuIndex === 0 || menuIndex === 1) {
        setSelectedMenuIndex(menuIndex);
      }
    }

    // Listen for session expiration events from axios interceptor
    const handleSessionExpired = (event) => {
      setMessage(event.detail.message || "Your session has expired. Please login again.");
      setUser("");
      setView("loginSignup");
      setSelectedMenuIndex(-1);
      setSelectedEntityIndex(-1);
      setSelectedEntity("");
      setMenuStateRestored(false);
      sessionStorage.removeItem('selectedMenuIndex');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, []);

  // Effect to restore menu state from location state
  useEffect(() => {
    if (location.state?.selectedMenuIndex !== undefined && !menuStateRestored) {
      console.log('Restoring menu state from location state:', location.state.selectedMenuIndex);
      const menuIndex = location.state.selectedMenuIndex;
      setSelectedMenuIndex(menuIndex);
      // Save to sessionStorage for persistence
      if (menuIndex === 0 || menuIndex === 1) {
        sessionStorage.setItem('selectedMenuIndex', menuIndex.toString());
      }
      setMenuStateRestored(true);
      // Clear the location state to prevent it from persisting
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state, menuStateRestored]);

  // Effect to save selectedMenuIndex to sessionStorage when it changes (for Manage or Settings menus)
  useEffect(() => {
    if (selectedMenuIndex === 0 || selectedMenuIndex === 1) {
      sessionStorage.setItem('selectedMenuIndex', selectedMenuIndex.toString());
    } else if (selectedMenuIndex === -1 && view === "home") {
      // Don't clear on home view - keep the last opened menu
      // Only clear when explicitly closed or on signout
    }
  }, [selectedMenuIndex, view]);

  // Effect to restore menu state when returning to home view
  useEffect(() => {
    if (view === "home" && selectedMenuIndex === -1 && user) {
      const savedMenuIndex = sessionStorage.getItem('selectedMenuIndex');
      if (savedMenuIndex !== null) {
        const menuIndex = parseInt(savedMenuIndex, 10);
        // Only restore if it's Manage (0) or Settings (1) menu
        if (menuIndex === 0 || menuIndex === 1) {
          setSelectedMenuIndex(menuIndex);
        }
      }
    }
  }, [view, selectedMenuIndex, user]);
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
        // Valid logged in user - redirect based on role
        setUser(response);
        
        // Redirect all logged-in users to their respective dashboards
        if (response.role === "admin") {
          navigate("/admin/dashboard");
          return;
        } else if (response.role === "resident") {
          navigate("/resident/dashboard");
          return;
        } else if (response.role === "driver") {
          navigate("/driver/dashboard");
          return;
        }
        
        // Fallback: show home view (shouldn't reach here)
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

    const entity = adminMenus[selectedMenuIndex].entities[selectedIndex];
    const entityName = entity.name.toLowerCase();

    // Check if this is a Manage menu item that should use routing
    if (selectedMenuIndex === 0 && ["areas", "drivers", "dustbins"].includes(entityName)) {
      navigate(`/${entityName}`, { state: { selectedMenuIndex } });
      return;
    }

    // Check if this is an Operations menu item that should use routing
    if (selectedMenuIndex === 1 && ["pickup requests"].includes(entityName)) {
      navigate(`/pickup-requests`, { state: { selectedMenuIndex } });
      return;
    }

    // Check if this is a Settings menu item that should use routing
    if (selectedMenuIndex === 3 && ["users"].includes(entityName)) {
      navigate(`/${entityName}`, { state: { selectedMenuIndex } });
      return;
    }

    if (selectedEntity.name == entity.name) {
      setSelectedMenuIndex(-1);
      setSelectedEntityIndex(-1);
      setView("home");
      return;
    }
    setSelectedEntityIndex(selectedIndex);
    // Create a fresh entity object without filterParams when navigating directly
    const freshEntity = { ...entity };
    // Remove any existing filterParams
    delete freshEntity.filterParams;
    setSelectedEntity(freshEntity);
    setView("content");
  }
  function handleSideBarMenuClick(index) {
    if (!user) {
      setMessage("Please log in to access menu options.");
      return;
    }
    // Check if this menu is a direct action menu (like calculator)
    if (adminMenus[index].isDirectAction) {
      const entity = adminMenus[index].directEntity;
      if (selectedEntity && selectedEntity.name === entity.name) {
        // If already selected, close it
        setSelectedMenuIndex(-1);
        setSelectedEntityIndex(-1);
        setView("home");
        setSelectedEntity("");
        // Clear saved menu index for direct action menus
        sessionStorage.removeItem('selectedMenuIndex');
      } else {
        // Open the calculator directly
        setSelectedMenuIndex(index);
        setSelectedEntityIndex(0);
        setSelectedEntity(entity);
        setView("content");
        // Don't save direct action menu index
        sessionStorage.removeItem('selectedMenuIndex');
      }
      return;
    }
    // Regular menu with dropdown
    if (selectedMenuIndex == index) {
      setSelectedMenuIndex(-1);
      // Clear saved menu index when closing dropdown
      if (index === 0 || index === 1) {
        sessionStorage.removeItem('selectedMenuIndex');
      }
    } else {
      setSelectedMenuIndex(index);
      // Save to sessionStorage for Manage or Settings menus
      if (index === 0 || index === 1) {
        sessionStorage.setItem('selectedMenuIndex', index.toString());
      }
    }
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
  }
  function handleLogInSignupButtonClick() {
    setView("loginSignup");
  }
  function setLoggedinUser(loggedinUser) {
    setMessage(""); // Clear any session expiration messages
    setUser(loggedinUser);
    
    // Redirect based on role
    if (loggedinUser && loggedinUser.role) {
      if (loggedinUser.role === "admin") {
        // Redirect admin to dashboard (uses AdminLayout)
        navigate("/admin/dashboard");
      } else if (loggedinUser.role === "resident") {
        // Redirect resident to their dashboard
        navigate("/resident/dashboard");
      } else if (loggedinUser.role === "driver") {
        // Redirect driver to their dashboard
        navigate("/driver/dashboard");
      } else {
        setView("home");
      }
    } else {
      setView("home");
    }
  }
  function handleSignoutClick() {
    setUser("");
    setView("home");
    setSelectedMenuIndex(-1);
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
    // Clear saved menu index on signout
    sessionStorage.removeItem('selectedMenuIndex');
    // remove jwt token from backend
    axios.post(import.meta.env.VITE_API_URL + "/api/users/signout");
  }
  function handleCloseLoginSignupPageClose() {
    setView("home");
  }
  function handleBackButtonClick() {
    setView("home");
    // Restore selectedMenuIndex from sessionStorage if not already set
    if (selectedMenuIndex === -1) {
      const savedMenuIndex = sessionStorage.getItem('selectedMenuIndex');
      if (savedMenuIndex !== null) {
        const menuIndex = parseInt(savedMenuIndex, 10);
        // Only restore if it's Manage (0) or Settings (1) menu
        if (menuIndex === 0 || menuIndex === 1) {
          setSelectedMenuIndex(menuIndex);
        }
      }
    }
    // Keep the menu dropdown open (don't reset selectedMenuIndex)
    // Only reset entity selection
    setSelectedEntityIndex(-1);
    setSelectedEntity("");
  }
  
  function navigateToEntity(entityName, filterParams = null) {
  // Block staff users from accessing Users (if needed in future)
  if (user && user.role === "staff" && entityName === "Users") {
      setMessage("You don't have permission to access this section.");
      return;
    }
    // Find the entity in adminMenus
    for (let menuIndex = 0; menuIndex < adminMenus.length; menuIndex++) {
      const menu = adminMenus[menuIndex];
      for (let entityIndex = 0; entityIndex < menu.entities.length; entityIndex++) {
        if (menu.entities[entityIndex].name === entityName) {
          setSelectedMenuIndex(menuIndex);
          setSelectedEntityIndex(entityIndex);
          
          // For entities that use route navigation
          const entityNameLower = entityName.toLowerCase();
          if (["areas", "drivers", "dustbins", "pickup requests", "users"].includes(entityNameLower)) {
            const routePath = entityNameLower === "pickup requests" ? "/pickup-requests" : `/${entityNameLower}`;
            navigate(routePath, { 
              state: { 
                selectedMenuIndex,
                filterParams: filterParams || null
              } 
            });
            return;
          }
          
          // For other entities, use content view
          // Add filter params to selectedEntity if provided
          const entity = { ...menu.entities[entityIndex] };
          if (filterParams) {
            entity.filterParams = filterParams;
          }
          setSelectedEntity(entity);
          setView("content");
          return;
        }
      }
    }
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
                {/* Enquiries Quick Link */}
                {/* <div className="mb-3 text-center">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToEntity("Enquiries");
                    }}
                    className="text-decoration-none"
                    style={{ fontSize: "1.1rem", fontWeight: "500", color: "#0d6efd" }}
                  >
                    Enquiries
                  </a>
                </div> */}
                {adminMenus.map((menu, menuIndex) => (
                  <div key={menuIndex} className="homepage-menu-card">
                    <button
                      className={`homepage-menu-btn ${selectedMenuIndex === menuIndex ? 'active' : ''}`}
                      onClick={() => handleSideBarMenuClick(menuIndex)}
                    >
                      <div className="homepage-menu-icon">
                        {menuIndex === 0 && <i className="bi bi-gear-fill"></i>}
                        {menuIndex === 1 && <i className="bi bi-clipboard-check"></i>}
                        {menuIndex === 2 && <i className="bi bi-graph-up-arrow"></i>}
                        {menuIndex === 3 && <i className="bi bi-sliders"></i>}
                      </div>
                      <span className="homepage-menu-text">{menu.name}</span>
                      <i className={`bi ${selectedMenuIndex === menuIndex ? 'bi-chevron-up' : 'bi-chevron-down'} homepage-menu-arrow`}></i>
                    </button>
                    {selectedMenuIndex === menuIndex && !menu.isDirectAction && (
                      <div className="homepage-submenu">
                        {menu.entities
                          .map((entity, entityIndex) => {
                            // Filter out "Users" menu if user role is "staff" (if needed in future)
                            if (user && user.role === "staff") {
                              if (entity.name === "Users") {
                                return null;
                              }
                            }
                            return { entity, entityIndex };
                          })
                          .filter(item => item !== null)
                          .map(({ entity, entityIndex }) => (
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
            tableName="users"
          />
        )}
        {view === "content" && (
          <AdminContentPage
            selectedEntity={selectedEntity}
            user={user}
            onBackButtonClick={handleBackButtonClick}
            onNavigateToEntity={navigateToEntity}
          />
        )}
      </div>
    </>
  );
}
