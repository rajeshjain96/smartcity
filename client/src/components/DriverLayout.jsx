import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function DriverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [driverDocId, setDriverDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assignToast, setAssignToast] = useState({ show: false, message: "" });
  const [pickupBadgeCount, setPickupBadgeCount] = useState(0);
  const [highlightPickupsNav, setHighlightPickupsNav] = useState(false);

  const playAssignNotificationSound = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      /* ignore */
    }
  }, []);
  
  // Determine active menu item
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (location.pathname.includes("/driver/pickups")) {
      setPickupBadgeCount(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!assignToast.show) return;
    const t = setTimeout(() => {
      setAssignToast((prev) => ({ ...prev, show: false }));
    }, 5500);
    return () => clearTimeout(t);
  }, [assignToast.show]);

  useEffect(() => {
    if (!user || !driverDocId) return;
    const base = import.meta.env.VITE_API_URL;
    if (!base) return;

    const socket = io(base, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    const onConnect = () => {
      socket.emit("joinDriverRoom", driverDocId);
    };

    const onPickupAssigned = (payload) => {
      const area = payload?.areaName || "Unknown area";
      setAssignToast({
        show: true,
        message: `New pickup assigned in ${area}`,
      });
      setPickupBadgeCount((c) => c + 1);
      setHighlightPickupsNav(true);
      setTimeout(() => setHighlightPickupsNav(false), 4000);
      playAssignNotificationSound();
    };

    socket.on("connect", onConnect);
    socket.on("pickupAssignedToDriver", onPickupAssigned);

    return () => {
      socket.off("connect", onConnect);
      socket.off("pickupAssignedToDriver", onPickupAssigned);
      socket.disconnect();
    };
  }, [user, driverDocId, playAssignNotificationSound]);

  async function checkAuth() {
    try {
      const response = await axios.get("/users/hello");
      const userData = response.data;

      if (userData && userData.role === "driver") {
        setUser(userData);
        try {
          const dr = await axios.get(`/drivers/user/${userData.userId}`);
          if (dr.data && dr.data._id) {
            setDriverDocId(String(dr.data._id));
          }
        } catch {
          /* driver profile may not exist yet */
        }
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
      {assignToast.show && (
        <div
          className="position-fixed top-0 end-0 p-3"
          style={{ zIndex: 2000, maxWidth: "min(100%, 380px)" }}
        >
          <div className="toast show shadow" role="alert">
            <div className="toast-header bg-success text-white">
              <i className="bi bi-truck me-2"></i>
              <strong className="me-auto">Pickup assigned</strong>
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={() => setAssignToast((prev) => ({ ...prev, show: false }))}
              />
            </div>
            <div className="toast-body">{assignToast.message}</div>
          </div>
        </div>
      )}

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
              className={`nav-link text-white ${
                isActive("/driver/pickups") ? "bg-secondary bg-opacity-50 rounded" : ""
              } ${highlightPickupsNav ? "border border-warning border-2 rounded shadow-sm" : ""}`}
            >
              <i className="bi bi-clipboard-check me-2"></i>
              My Pickups
              {pickupBadgeCount > 0 && (
                <span className="badge bg-danger rounded-pill ms-1">{pickupBadgeCount}</span>
              )}
            </Link>
            <Link 
              to="/driver/map" 
              className={`nav-link text-white ${isActive("/driver/map") ? "bg-secondary bg-opacity-50 rounded" : ""}`}
            >
              <i className="bi bi-geo-alt me-2"></i>
              Map View
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
