import { useEffect, useState } from "react";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalDustbins: 0,
    totalAreas: 0,
    pendingRequests: 0,
    activeRequests: 0,
    collectedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [usersRes, driversRes, dustbinsRes, areasRes, requestsRes] = await Promise.all([
        axios.get("/users").catch(() => ({ data: [] })),
        axios.get("/drivers").catch(() => ({ data: [] })),
        axios.get("/dustbins").catch(() => ({ data: [] })),
        axios.get("/areas").catch(() => ({ data: [] })),
        axios.get("/pickupRequests").catch(() => ({ data: [] })),
      ]);

      const requests = requestsRes.data || [];
      
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalDrivers: driversRes.data?.length || 0,
        totalDustbins: dustbinsRes.data?.length || 0,
        totalAreas: areasRes.data?.length || 0,
        pendingRequests: requests.filter(r => r.status === "Pending").length,
        activeRequests: requests.filter(r => r.status === "Assigned" || r.status === "InProgress").length,
        collectedRequests: requests.filter(r => r.status === "Collected").length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
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
      <h2 className="mb-4">Admin Dashboard</h2>
      
      <div className="row g-4">
        {/* System Stats */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-people fs-1 text-primary"></i>
              <h3 className="mt-3 mb-0">{stats.totalUsers}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-truck fs-1 text-success"></i>
              <h3 className="mt-3 mb-0">{stats.totalDrivers}</h3>
              <p className="text-muted mb-0">Active Drivers</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-trash fs-1 text-info"></i>
              <h3 className="mt-3 mb-0">{stats.totalDustbins}</h3>
              <p className="text-muted mb-0">Dustbins</p>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-geo-alt fs-1 text-warning"></i>
              <h3 className="mt-3 mb-0">{stats.totalAreas}</h3>
              <p className="text-muted mb-0">Areas</p>
            </div>
          </div>
        </div>

        {/* Pickup Requests Stats */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-clock-history fs-1 text-warning"></i>
              <h3 className="mt-3 mb-0">{stats.pendingRequests}</h3>
              <p className="text-muted mb-0">Pending Requests</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-arrow-repeat fs-1 text-primary"></i>
              <h3 className="mt-3 mb-0">{stats.activeRequests}</h3>
              <p className="text-muted mb-0">Active Requests</p>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <i className="bi bi-check-circle fs-1 text-success"></i>
              <h3 className="mt-3 mb-0">{stats.collectedRequests}</h3>
              <p className="text-muted mb-0">Collected Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <a href="/pickup-requests" className="btn btn-outline-primary">
                  <i className="bi bi-clipboard-check me-2"></i>Manage Pickup Requests
                </a>
                <a href="/drivers" className="btn btn-outline-success">
                  <i className="bi bi-truck me-2"></i>Manage Drivers
                </a>
                <a href="/dustbins" className="btn btn-outline-info">
                  <i className="bi bi-trash me-2"></i>Manage Dustbins
                </a>
                <a href="/areas" className="btn btn-outline-warning">
                  <i className="bi bi-geo-alt me-2"></i>Manage Areas
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
