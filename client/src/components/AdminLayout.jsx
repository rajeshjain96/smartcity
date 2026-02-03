import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";
import AdminManageMenus from "./AdminManageMenus";
import AdminOperationsMenus from "./AdminOperationsMenus";
import AdminSettingMenus from "./AdminSettingMenus";
import AdminReportMenus from "./AdminReportMenus";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  
  const adminMenus = [];
  adminMenus.push(AdminManageMenus);
  adminMenus.push(AdminOperationsMenus);
  adminMenus.push(AdminReportMenus);
  adminMenus.push(AdminSettingMenus);
  
  // Determine active menu item based on current route
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };
  
  // Map routes to menu items for auto-expanding menu
  const getMenuForRoute = (pathname) => {
    if (pathname.includes("/admin/areas")) return { menuIndex: 0, entityName: "Areas" };
    if (pathname.includes("/admin/drivers")) return { menuIndex: 0, entityName: "Drivers" };
    if (pathname.includes("/admin/dustbins")) return { menuIndex: 0, entityName: "Dustbins" };
    if (pathname.includes("/admin/pickup-requests")) return { menuIndex: 1, entityName: "Pickup Requests" };
    if (pathname.includes("/admin/users")) return { menuIndex: 3, entityName: "Users" };
    if (pathname.includes("/admin/dashboard")) return { menuIndex: -1, entityName: "Dashboard" };
    return null;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Set active menu based on current route
    const menuInfo = getMenuForRoute(location.pathname);
    if (menuInfo && menuInfo.menuIndex !== -1) {
      setSelectedMenuIndex(menuInfo.menuIndex);
    }
  }, [location.pathname]);

  async function checkAuth() {
    try {
      const response = await axios.get("/users/hello");
      const userData = response.data;
      
      if (userData && userData.role === "admin") {
        setUser(userData);
      } else {
        navigate("/");
      }
    } catch (error) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignout() {
    try {
      await axios.post("/users/signout");
      navigate("/");
    } catch (error) {
      console.error("Signout error:", error);
      navigate("/");
    }
  }

  function handleMenuClick(menuIndex) {
    if (selectedMenuIndex === menuIndex) {
      setSelectedMenuIndex(-1);
    } else {
      setSelectedMenuIndex(menuIndex);
    }
  }

  function handleEntityClick(entityName) {
    // Navigate to the appropriate route
    const routeMap = {
      "Areas": "/admin/areas",
      "Drivers": "/admin/drivers",
      "Dustbins": "/admin/dustbins",
      "Pickup Requests": "/admin/pickup-requests",
      "Users": "/admin/users",
    };
    
    const route = routeMap[entityName];
    if (route) {
      navigate(route);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div 
        className={`bg-dark text-white ${sidebarOpen ? "d-block" : "d-none d-md-block"}`}
        style={{ width: "250px", position: "fixed", height: "100vh", overflowY: "auto", zIndex: 1000 }}
      >
        <div className="p-3">
          <h4 className="mb-4">
            <i className="bi bi-recycle me-2"></i>
            Smart Garbage
          </h4>
          
          <div className="mb-4">
            <small className="text-muted">Admin Portal</small>
            <div className="text-white">{user?.name}</div>
          </div>

          <nav className="nav flex-column">
            {/* Dashboard Link */}
            <Link 
              to="/admin/dashboard" 
              className={`nav-link text-white ${isActive("/admin/dashboard") ? "bg-secondary bg-opacity-50 rounded" : ""}`}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
            
            <hr className="text-white-50 my-2" />
            
            {/* Menu Sections */}
            {adminMenus.map((menu, menuIndex) => (
              <div key={menuIndex}>
                <button
                  className={`nav-link text-white btn btn-link text-start w-100 ${selectedMenuIndex === menuIndex ? "bg-secondary bg-opacity-25 rounded" : ""}`}
                  onClick={() => handleMenuClick(menuIndex)}
                  style={{ textDecoration: "none" }}
                >
                  <i className={`bi ${menuIndex === 0 ? "bi-gear-fill" : menuIndex === 1 ? "bi-clipboard-check" : menuIndex === 2 ? "bi-graph-up-arrow" : "bi-sliders"} me-2`}></i>
                  {menu.name}
                  <i className={`bi float-end ${selectedMenuIndex === menuIndex ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                </button>
                
                {selectedMenuIndex === menuIndex && menu.entities && menu.entities.length > 0 && (
                  <div className="ms-3">
                    {menu.entities.map((entity, entityIndex) => {
                      const routeMap = {
                        "Areas": "/admin/areas",
                        "Drivers": "/admin/drivers",
                        "Dustbins": "/admin/dustbins",
                        "Pickup Requests": "/admin/pickup-requests",
                        "Users": "/admin/users",
                      };
                      const route = routeMap[entity.name];
                      const isEntityActive = route && isActive(route);
                      
                      return (
                        <Link
                          key={entityIndex}
                          to={route || "#"}
                          className={`nav-link text-white-50 small ${isEntityActive ? "bg-secondary bg-opacity-50 rounded" : ""}`}
                          onClick={() => route && navigate(route)}
                        >
                          <i className="bi bi-arrow-right-circle me-2"></i>
                          {entity.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            <hr className="text-white-50 my-2" />
            
            <button 
              className="nav-link text-white btn btn-link text-start"
              onClick={handleSignout}
            >
              <i className="bi bi-box-arrow-right me-2"></i>
              Sign Out
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: sidebarOpen || window.innerWidth >= 768 ? "250px" : "0", flex: 1 }}>
        {/* Top Bar */}
        <nav className="navbar navbar-light bg-white border-bottom">
          <div className="container-fluid">
            <button 
              className="btn btn-outline-secondary d-md-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="bi bi-list"></i>
            </button>
            <span className="navbar-brand mb-0 h1 d-none d-md-block">Admin Portal</span>
            <div className="d-flex align-items-center gap-2">
              <span className="d-md-none">{user?.name}</span>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleSignout}
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div style={{ minHeight: "calc(100vh - 56px)" }}>
          <Outlet />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50 d-md-none"
          style={{ zIndex: 999 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
