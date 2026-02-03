import "./App.css";
import AdminMainPage from "./components/AdminMainPage";
import axios from "axios";
import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import { useIsMobile } from "./utils/useIsMobile";
import TrialPage from "./components/TrialPage";
import OwnerPage from "./components/OwnerPage";
import OwnerMainPage from "./components/OwnerMainPage";
import CheckboxToggle from "./components/CheckboxToggle";
import { EntityActionProvider } from "./contexts/EntityActionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ResidentLayout from "./components/ResidentLayout";
import DriverLayout from "./components/DriverLayout";
import AdminDashboard from "./components/AdminDashboard";
import ResidentDashboard from "./components/ResidentDashboard";
import DriverDashboard from "./components/DriverDashboard";
import AdminCustomers from "./components/AdminCustomers";
import AdminEnquiries from "./components/AdminEnquiries";
import AdminMeasurements from "./components/AdminMeasurements";
import AdminQuotations from "./components/AdminQuotations";
import AdminUsers from "./components/AdminUsers";
import AdminRates from "./components/AdminRates";
import AdminCompanies from "./components/AdminCompanies";
import AdminCatalogs from "./components/AdminCatalogs";
import AdminShopDetails from "./components/AdminShopDetails";
import AdminDustbins from "./components/AdminDustbins";
import AdminAreas from "./components/AdminAreas";
import AdminDrivers from "./components/AdminDrivers";
import AdminPickupRequests from "./components/AdminPickupRequests";
import ResidentPickupRequests from "./components/ResidentPickupRequests";
import DriverPickupRequests from "./components/DriverPickupRequests";

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
            
            {/* Admin Routes - Protected */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMainPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin Management Routes */}
            <Route path="/customers" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCustomers />
              </ProtectedRoute>
            } />
            <Route path="/enquiries" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminEnquiries />
              </ProtectedRoute>
            } />
            <Route path="/measurements" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMeasurements />
              </ProtectedRoute>
            } />
            <Route path="/quotations" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminQuotations />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/rates" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRates />
              </ProtectedRoute>
            } />
            <Route path="/companies" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCompanies />
              </ProtectedRoute>
            } />
            <Route path="/catalogs" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminCatalogs />
              </ProtectedRoute>
            } />
            <Route path="/shopdetails" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminShopDetails />
              </ProtectedRoute>
            } />
            <Route path="/dustbins" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDustbins />
              </ProtectedRoute>
            } />
            <Route path="/areas" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAreas />
              </ProtectedRoute>
            } />
            <Route path="/drivers" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDrivers />
              </ProtectedRoute>
            } />
            <Route path="/pickup-requests" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPickupRequests />
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
            </Route>
            
            {/* Legacy route - redirect to nested route */}
            <Route path="/driver-pickups" element={
              <ProtectedRoute allowedRoles={["driver"]}>
                <Navigate to="/driver/pickups" replace />
              </ProtectedRoute>
            } />
            
            {/* Legacy/Other Routes */}
            <Route path="/ownerrajesh" element={<OwnerMainPage />} />
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
