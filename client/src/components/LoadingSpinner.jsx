import { HashLoader } from "react-spinners";

export default function LoadingSpinner({ size = 50, color = "#667eea" }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <HashLoader 
        color={color} 
        size={size}
        speedMultiplier={0.8}
      />
      <p className="text-muted mt-3 mb-0 small">Loading...</p>
    </div>
  );
}



