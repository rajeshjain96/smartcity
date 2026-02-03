import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    activeRequests: 0,
    collectedRequests: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await axios.get("/pickupRequests");
      const requests = response.data || [];
      
      setStats({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === "Pending").length,
        activeRequests: requests.filter(r => r.status === "Assigned" || r.status === "InProgress").length,
        collectedRequests: requests.filter(r => r.status === "Collected").length,
      });

      // Get recent 5 requests
      setRecentRequests(requests.slice(0, 5));
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
      <h2 className="mb-4">Resident Dashboard</h2>
      
      <div className="row g-4 mb-4">
        {/* Stats Cards */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-clipboard-check fs-1 text-primary"></i>
              <h3 className="mt-3 mb-0">{stats.totalRequests}</h3>
              <p className="text-muted mb-0">Total Requests</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-clock-history fs-1 text-warning"></i>
              <h3 className="mt-3 mb-0">{stats.pendingRequests}</h3>
              <p className="text-muted mb-0">Pending</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-arrow-repeat fs-1 text-info"></i>
              <h3 className="mt-3 mb-0">{stats.activeRequests}</h3>
              <p className="text-muted mb-0">In Progress</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 text-success"></i>
              <h3 className="mt-3 mb-0">{stats.collectedRequests}</h3>
              <p className="text-muted mb-0">Collected</p>
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
                  onClick={() => navigate("/resident/pickup-requests")}
                >
                  <i className="bi bi-plus-lg me-2"></i>Request Garbage Pickup
                </button>
                <button 
                  className="btn btn-outline-primary btn-lg"
                  onClick={() => navigate("/resident/pickup-requests")}
                >
                  <i className="bi bi-list-ul me-2"></i>View All Requests
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Recent Pickup Requests</h5>
              {recentRequests.length === 0 ? (
                <p className="text-muted text-center my-4">
                  No pickup requests yet. Click "Request Garbage Pickup" to create your first request.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Garbage Type</th>
                        <th>Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.map((request) => (
                        <tr key={request._id}>
                          <td>{new Date(request.addDate).toLocaleDateString()}</td>
                          <td>{request.garbageType}</td>
                          <td>{request.address}</td>
                          <td>
                            <span className={getStatusBadgeClass(request.status)}>
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
