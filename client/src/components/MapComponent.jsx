import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default icon path issue
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

// Custom colored markers based on status
const createCustomIcon = (color) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
      <path fill="${color}" stroke="#fff" stroke-width="2" d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"/>
      <circle fill="#fff" cx="12.5" cy="12.5" r="5"/>
    </svg>
  `;
  
  return new Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgIcon)}`,
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41],
  });
};

const statusColors = {
  Empty: "#28a745", // Green
  Half: "#ffc107",  // Yellow
  Full: "#dc3545",  // Red
  default: "#6c757d", // Gray
};

export default function MapComponent({ markers = [], center: providedCenter, zoom = 10, height = "600px" }) {
  // Calculate center from markers if not provided
  let center = providedCenter;
  if (!center && markers.length > 0) {
    const lats = markers.map(m => m.position[0]).filter(Boolean);
    const lngs = markers.map(m => m.position[1]).filter(Boolean);
    if (lats.length > 0 && lngs.length > 0) {
      center = [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length,
      ];
    }
  }
  
  // Default center if still not set
  if (!center) {
    center = [20.5937, 78.9629];
  }

  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {markers.map((marker, index) => {
          if (!marker.position || !marker.position[0] || !marker.position[1]) {
            return null;
          }
          
          const status = marker.status || "default";
          const color =
            marker.colorOverride ||
            statusColors[status] ||
            statusColors.default;
          const customIcon = createCustomIcon(color);

          return (
            <Marker key={marker.id || index} position={marker.position} icon={customIcon}>
              <Popup>
                <div style={{ minWidth: "200px" }}>
                  {marker.popupContent}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "white",
          padding: "10px",
          borderRadius: "5px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: 1000,
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Status</div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
          <div style={{ width: "20px", height: "20px", background: statusColors.Empty, borderRadius: "50%", marginRight: "8px", border: "2px solid white" }}></div>
          <span>Empty</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "3px" }}>
          <div style={{ width: "20px", height: "20px", background: statusColors.Half, borderRadius: "50%", marginRight: "8px", border: "2px solid white" }}></div>
          <span>Half</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: "20px", height: "20px", background: statusColors.Full, borderRadius: "50%", marginRight: "8px", border: "2px solid white" }}></div>
          <span>Full</span>
        </div>
      </div>
    </div>
  );
}
