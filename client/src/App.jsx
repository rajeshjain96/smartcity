import "./App.css";
import AdminMainPage from "./components/AdminMainPage";
import axios from "axios";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { useIsMobile } from "./utils/useIsMobile";
import CheckboxToggle from "./components/CheckboxToggle";
import { EntityActionProvider } from "./contexts/EntityActionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import ResidentLayout from "./components/ResidentLayout";
import DriverLayout from "./components/DriverLayout";
import AdminDashboard from "./components/AdminDashboard";
import ResidentDashboard from "./components/ResidentDashboard";
import DriverDashboard from "./components/DriverDashboard";
import AdminUsers from "./components/AdminUsers";
import AdminDustbins from "./components/AdminDustbins";
import AdminAreas from "./components/AdminAreas";
import AdminDrivers from "./components/AdminDrivers";
import AdminPickupRequests from "./components/AdminPickupRequests";
import AdminMapView from "./components/AdminMapView";
import AdminReportsDashboard from "./components/AdminReportsDashboard";
import ResidentPickupRequests from "./components/ResidentPickupRequests";
import DriverPickupRequests from "./components/DriverPickupRequests";
import DriverMapView from "./components/DriverMapView";

function App() {
  axios.defaults.withCredentials = true; // ⬅️ Important!
  window.maxCnt = useIsMobile() ? 2 : 5;
  window.formLayout = "doubleColumns"; // doubleColumns
  
  return (
    <>
      <EntityActionProvider>
        <Router>
          <Routes>
            {/* Public Route - Login Page */}
            <Route path="/" element={<AdminMainPage />} />
            
            {/* Admin Routes - Protected with AdminLayout */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="areas" element={<AdminAreas />} />
              <Route path="drivers" element={<AdminDrivers />} />
              <Route path="dustbins" element={<AdminDustbins />} />
              <Route path="pickup-requests" element={<AdminPickupRequests />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="map" element={<AdminMapView />} />
              <Route path="reports" element={<AdminReportsDashboard />} />
            </Route>
            
            {/* Legacy routes - redirect to /admin/* namespace */}
            <Route path="/areas" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/areas" replace />
              </ProtectedRoute>
            } />
            <Route path="/drivers" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/drivers" replace />
              </ProtectedRoute>
            } />
            <Route path="/dustbins" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/dustbins" replace />
              </ProtectedRoute>
            } />
            <Route path="/pickup-requests" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/pickup-requests" replace />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Navigate to="/admin/users" replace />
              </ProtectedRoute>
            } />
            
            {/* Resident Routes - Protected */}
            <Route path="/resident" element={
              <ProtectedRoute allowedRoles={["resident"]}>
                <ResidentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/resident/dashboard" replace />} />
              <Route path="dashboard" element={<ResidentDashboard />} />
              <Route path="pickup-requests" element={<ResidentPickupRequests />} />
            </Route>
            
            {/* Legacy route - redirect to nested route */}
            <Route path="/my-pickup-requests" element={
              <ProtectedRoute allowedRoles={["resident"]}>
                <Navigate to="/resident/pickup-requests" replace />
              </ProtectedRoute>
            } />
            
            {/* Driver Routes - Protected */}
            <Route path="/driver" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <DriverLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/driver/dashboard" replace />} />
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="pickups" element={<DriverPickupRequests />} />
              <Route path="map" element={<DriverMapView />} />
            </Route>
            
            {/* Legacy route - redirect to nested route */}
            <Route path="/driver-pickups" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Navigate to="/driver/pickups" replace />
              </ProtectedRoute>
            } />
            
            {/* Legacy/Other Routes */}
            {/* <Route path="/ownerrajesh" element={<OwnerMainPage />} /> */}
            <Route path="/trial" element={<CheckboxToggle />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </EntityActionProvider>
    </>
  );
}
export default App;
