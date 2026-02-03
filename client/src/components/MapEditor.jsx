import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ Fix default icon path issue
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function MapEditor({
  value = { lat: 20.5937, lng: 78.9629 },
  onChange,
  height = 450,
  zoom = 5,
}) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const center = [value.lat || 20.5937, value.lng || 78.9629];

  // Map click handler
  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (onChange) onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return null;
  }

  // Fly to marker whenever value changes
  function FlyToMarker({ position }) {
    const map = useMap();
    if (position && position.lat !== undefined) {
      map.flyTo([position.lat, position.lng], 13, { animate: true });
    }
    return null;
  }

  // Show current zoom level
  function ZoomLevelDisplay() {
    const map = useMap();
    const [zoomLevel, setZoomLevel] = useState(map.getZoom());

    useMapEvents({
      zoomend: () => setZoomLevel(map.getZoom()),
    });

    return (
      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          padding: "5px 10px",
          background: "rgba(255,255,255,0.8)",
          borderRadius: "4px",
          fontSize: "14px",
          zIndex: 1000,
        }}
      >
        Zoom: {zoomLevel}
      </div>
    );
  }

  // Fetch suggestions from OpenStreetMap
  async function handleSearch(e) {
    const q = e.target.value;
    setSearch(q);
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Nominatim error:", err);
    }
  }

  // Select an address
  function handleSelect(s) {
    const loc = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    setSearch(s.display_name);
    setSuggestions([]);
    if (onChange) onChange(loc);
  }

  return (
    <div style={{ height, position: "relative" }}>
      {/* Centered Search Box */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "320px",
        }}
      >
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search address..."
          style={{
            width: "100%",
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            outline: "none",
            fontSize: 14,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        />
        {suggestions.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "8px",
              maxHeight: "180px",
              overflowY: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              position: "absolute",
              top: "calc(100% + 4px)",
              width: "100%",
              zIndex: 1001,
            }}
          >
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                onClick={() => handleSelect(s)}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  fontSize: 13,
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f1f1f1")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "#fff")
                }
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <ClickHandler />
        {value && value.lat !== undefined && <Marker position={[value.lat, value.lng]} />}
        {value && value.lat !== undefined && <FlyToMarker position={value} />}
        <ZoomLevelDisplay />
      </MapContainer>
    </div>
  );
}
