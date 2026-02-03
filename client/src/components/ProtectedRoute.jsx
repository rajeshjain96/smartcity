import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Check if user session exists
      const response = await axios.get("/users/hello");
      const userData = response.data;
      
      if (userData && userData.role) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.log("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <LoadingSpinner size={50} />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but not authorized for this role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user's role
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === "resident") {
      return <Navigate to="/resident/dashboard" replace />;
    } else if (user.role === "driver") {
      return <Navigate to="/driver/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Authenticated and authorized
  return children;
}
