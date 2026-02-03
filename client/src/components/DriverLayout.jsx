import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await axios.get("/users/hello");
      const userData = response.data;
      
      if (userData && userData.role === "driver") {
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
            <i className="bi bi-truck me-2"></i>
            Smart Garbage
          </h4>
          
          <div className="mb-4">
            <small className="text-muted">Driver Portal</small>
            <div className="text-white">{user?.name}</div>
          </div>

          <nav className="nav flex-column">
            <Link 
              to="/driver/dashboard" 
              className={`nav-link text-white ${isActive("/driver/dashboard") ? "bg-secondary bg-opacity-50 rounded" : ""}`}
            >
              <i className="bi bi-speedometer2 me-2"></i>
              Dashboard
            </Link>
            <Link 
              to="/driver/pickups" 
              className={`nav-link text-white ${isActive("/driver/pickups") ? "bg-secondary bg-opacity-50 rounded" : ""}`}
            >
              <i className="bi bi-clipboard-check me-2"></i>
              My Pickups
            </Link>
            <hr className="text-white-50" />
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
            <span className="navbar-brand mb-0 h1 d-none d-md-block">Driver Portal</span>
            <span className="d-md-none">{user?.name}</span>
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
