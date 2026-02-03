import { useEffect, useState } from "react";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";
import MapComponent from "./MapComponent";

export default function DriverMapView() {
  const [requestList, setRequestList] = useState([]);
  const [dustbinList, setDustbinList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (requestList.length > 0 && dustbinList.length > 0 && areaList.length > 0) {
      createMarkers();
    }
  }, [requestList, dustbinList, areaList]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch pickup requests (backend filters by driver and enriches with areaName/dustbinName)
      const requestsRes = await axios.get("/pickupRequests");
      const requests = requestsRes.data || [];
      
      // Filter to only active requests (not cancelled)
      const activeRequests = requests.filter(r => r.status !== "Cancelled");
      setRequestList(activeRequests);

      // Fetch dustbins - drivers can access dustbins API (it's not admin-only)
      // We need dustbin locations for the map
      try {
        const dustbinsRes = await axios.get("/dustbins");
        setDustbinList(dustbinsRes.data || []);
      } catch (e) {
        console.log("Could not fetch dustbins:", e);
        setDustbinList([]);
      }

      // Areas are admin-only, but we have areaName from backend enrichment
      setAreaList([]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function createMarkers() {
    const newMarkers = requestList
      .map(request => {
        // Find dustbin location
        let dustbin = null;
        if (request.dustbinId) {
          dustbin = dustbinList.find(d => 
            d._id === request.dustbinId || 
            d._id?.toString() === request.dustbinId?.toString() ||
            request.dustbinId?.toString() === d._id?.toString()
          );
        }

        // Use dustbin location if available, otherwise skip
        if (!dustbin || !dustbin.location || !dustbin.location.lat || !dustbin.location.lng) {
          return null;
        }

        // Get area name (from enrichment or lookup)
        const areaName = request.areaName || "N/A";
        const dustbinName = request.dustbinName || dustbin.binName || "N/A";

        // Create Google Maps navigation link
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dustbin.location.lat},${dustbin.location.lng}`;

        const popupContent = (
          <div>
            <h6 style={{ marginBottom: "8px", fontWeight: "bold" }}>Pickup Request</h6>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div><strong>Dustbin:</strong> {dustbinName}</div>
              <div><strong>Area:</strong> {areaName}</div>
              <div><strong>Status:</strong> <span style={{ 
                color: request.status === "Pending" ? "#ffc107" : 
                       request.status === "Assigned" ? "#0dcaf0" :
                       request.status === "InProgress" ? "#0d6efd" :
                       request.status === "Collected" ? "#198754" : "#6c757d",
                fontWeight: "bold"
              }}>{request.status}</span></div>
              <div><strong>Type:</strong> {request.garbageType}</div>
              {request.address && (
                <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
                  <i className="bi bi-geo-alt me-1"></i>
                  {request.address}
                </div>
              )}
              <div style={{ marginTop: "10px" }}>
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  <i className="bi bi-navigation me-1"></i>
                  Navigate
                </a>
              </div>
            </div>
          </div>
        );

        // Use dustbin status for marker color, or default based on request status
        let status = dustbin.status;
        if (!status) {
          // Fallback: use request status to determine color
          status = request.status === "Collected" ? "Empty" : 
                   request.status === "InProgress" ? "Half" : "Full";
        }

        return {
          id: request._id,
          position: [dustbin.location.lat, dustbin.location.lng],
          status: status,
          popupContent,
        };
      })
      .filter(Boolean); // Remove null entries

    setMarkers(newMarkers);
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="mb-3">
        <h3>My Assigned Pickups - Map View</h3>
        <p className="text-muted">
          View your assigned pickup requests on the map. Click markers for details and navigation.
        </p>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <MapComponent 
            markers={markers} 
            zoom={markers.length > 0 ? 12 : 5}
            height="600px"
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Active Requests:</strong> {requestList.length} | 
          <strong className="ms-3">With Location:</strong> {markers.length}
        </div>
      </div>
    </div>
  );
}
