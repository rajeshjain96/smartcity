import { useEffect, useState } from "react";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";
import MapComponent from "./MapComponent";

export default function AdminMapView() {
  const [dustbinList, setDustbinList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState([]);
  const [predictionByDustbinId, setPredictionByDustbinId] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (dustbinList.length > 0 && areaList.length > 0 && driverList.length > 0) {
      createMarkers();
    }
  }, [dustbinList, areaList, driverList, predictionByDustbinId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [dustbinsRes, areasRes, driversRes, predictionsRes] = await Promise.all([
        axios.get("/dustbins"),
        axios.get("/areas"),
        axios.get("/drivers"),
        axios.get("/predictions/dustbins").catch(() => ({ data: [] })),
      ]);

      setDustbinList(dustbinsRes.data || []);
      setAreaList(areasRes.data || []);
      setDriverList(driversRes.data || []);
      const preds = predictionsRes.data || [];
      const map = {};
      preds.forEach((p) => {
        if (p.dustbinId) map[p.dustbinId] = p;
      });
      setPredictionByDustbinId(map);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  function createMarkers() {
    const newMarkers = dustbinList
      .filter(dustbin => dustbin.location && dustbin.location.lat && dustbin.location.lng)
      .map(dustbin => {
        // Find area name
        const area = areaList.find(a => 
          a._id === dustbin.areaId || 
          a._id?.toString() === dustbin.areaId?.toString() ||
          dustbin.areaId?.toString() === a._id?.toString()
        );
        const areaName = area ? area.areaName : "N/A";

        // Find driver name
        const driver = driverList.find(d => 
          d._id === dustbin.assignedDriverId || 
          d._id?.toString() === dustbin.assignedDriverId?.toString() ||
          dustbin.assignedDriverId?.toString() === d._id?.toString()
        );
        const driverName = driver ? driver.driverName : "Not Assigned";

        const pred = predictionByDustbinId[dustbin._id?.toString?.() || dustbin._id];
        const riskLevel = pred?.riskLevel;
        let colorOverride = null;
        if (riskLevel === "High") colorOverride = "#dc3545";
        else if (riskLevel === "Medium") colorOverride = "#fd7e14";

        const popupContent = (
          <div>
            <h6 style={{ marginBottom: "8px", fontWeight: "bold" }}>{dustbin.binName}</h6>
            <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
              <div><strong>Area:</strong> {areaName}</div>
              {pred && (
                <div>
                  <strong>Fill risk (recent pickups):</strong>{" "}
                  <span style={{
                    color: riskLevel === "High" ? "#dc3545" : riskLevel === "Medium" ? "#fd7e14" : "#6c757d",
                    fontWeight: "bold",
                  }}>{riskLevel}</span>
                  {typeof pred.requestCount === "number" && (
                    <span className="text-muted"> ({pred.requestCount} in {pred.windowDays}d)</span>
                  )}
                </div>
              )}
              <div><strong>Status:</strong> <span style={{ 
                color: dustbin.status === "Empty" ? "#28a745" : 
                       dustbin.status === "Half" ? "#ffc107" : "#dc3545",
                fontWeight: "bold"
              }}>{dustbin.status || "N/A"}</span></div>
              <div><strong>Driver:</strong> {driverName}</div>
              {dustbin.address && (
                <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
                  <i className="bi bi-geo-alt me-1"></i>
                  {dustbin.address}
                </div>
              )}
            </div>
          </div>
        );

        return {
          id: dustbin._id,
          position: [dustbin.location.lat, dustbin.location.lng],
          status: dustbin.status,
          colorOverride,
          popupContent,
        };
      });

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
        <h3>Dustbin Map View</h3>
        <p className="text-muted">
          View all dustbins on the map. Click on markers to see details.
          High fill-risk dustbins (from recent pickup frequency) use red markers; medium risk uses orange.
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
          <strong>Total Dustbins:</strong> {dustbinList.length} | 
          <strong className="ms-3">With Location:</strong> {markers.length}
        </div>
      </div>
    </div>
  );
}
