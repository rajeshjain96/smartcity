import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function DriverDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingPickup: 0,
    inProgress: 0,
    completedToday: 0,
  });
  const [todayRequests, setTodayRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get("/pickupRequests");
      const requests = response.data || [];
      
      // Filter today's completed requests
      const today = new Date().toDateString();
      const todayCompleted = requests.filter(r => {
        if (!r.collectedAt) return false;
        return new Date(r.collectedAt).toDateString() === today;
      });

      setStats({
        totalAssigned: requests.length,
        pendingPickup: requests.filter(r => r.status === "Assigned").length,
        inProgress: requests.filter(r => r.status === "InProgress").length,
        completedToday: todayCompleted.length,
      });

      // Get recent assigned requests
      const activeRequests = requests.filter(r => 
        r.status === "Assigned" || r.status === "InProgress"
      ).slice(0, 5);
      
      setTodayRequests(activeRequests);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Pending": return "badge bg-warning text-dark";
      case "Assigned": return "badge bg-info text-dark";
      case "InProgress": return "badge bg-primary";
      case "Collected": return "badge bg-success";
      case "Cancelled": return "badge bg-secondary";
      default: return "badge bg-secondary";
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">Driver Dashboard</h2>
      
      <div className="row g-4 mb-4">
        {/* Stats Cards */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-clipboard-check fs-1 text-primary"></i>
              <h3 className="mt-3 mb-0">{stats.totalAssigned}</h3>
              <p className="text-muted mb-0">Total Assigned</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-clock-history fs-1 text-info"></i>
              <h3 className="mt-3 mb-0">{stats.pendingPickup}</h3>
              <p className="text-muted mb-0">Pending Pickup</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-arrow-repeat fs-1 text-warning"></i>
              <h3 className="mt-3 mb-0">{stats.inProgress}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 text-success"></i>
              <h3 className="mt-3 mb-0">{stats.completedToday}</h3>
              <p className="text-muted mb-0">Completed Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="d-grid gap-2 d-md-flex">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => navigate("/driver/pickups")}
                >
                  <i className="bi bi-truck me-2"></i>View My Pickups
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Active Pickups */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Today's Active Pickups</h5>
              {todayRequests.length === 0 ? (
                <p className="text-muted text-center my-4">
                  No active pickup requests. Check back later for new assignments.
                </p>
              ) : (
                <div className="row g-3">
                  {todayRequests.map((request) => (
                    <div key={request._id} className="col-md-6">
                      <div className="card h-100 border-start border-primary border-4">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="card-title mb-0">{request.garbageType}</h6>
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </div>
                          <p className="card-text mb-1">
                            <i className="bi bi-geo-alt me-2"></i>
                            {request.address}
                          </p>
                          {request.notes && (
                            <p className="card-text small text-muted mb-2">
                              <i className="bi bi-sticky me-2"></i>
                              {request.notes}
                            </p>
                          )}
                          <button 
                            className="btn btn-sm btn-primary mt-2"
                            onClick={() => navigate("/driver/pickups")}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
