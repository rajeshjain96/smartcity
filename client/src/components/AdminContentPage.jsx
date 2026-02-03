import AdminCustomers from "./AdminCustomers";
import AdminEnquiries from "./AdminEnquiries";
import AdminMeasurements from "./AdminMeasurements";
import AdminQuotations from "./AdminQuotations";
import AdminReportActivities from "./AdminReportActivities";
import AdminUsers from "./AdminUsers";
import AdminRates from "./AdminRates";
import AdminCompanies from "./AdminCompanies";
import AdminCatalogs from "./AdminCatalogs";
import AdminShopDetails from "./AdminShopDetails";
import AdminDustbins from "./AdminDustbins";
import AdminAreas from "./AdminAreas";
import AdminDrivers from "./AdminDrivers";
import AdminPickupRequests from "./AdminPickupRequests";
import AdminCurtainRateCalculator from "./AdminCurtainRateCalculator";
export default function ContentPage(props) {
  let { selectedEntity } = props;
  let { user } = props;
  let { onNavigateToEntity } = props;
  
  // Block staff users from accessing Users or ShopDetails
  if (user && user.role === "staff" && (selectedEntity.name === "Users" || selectedEntity.name === "ShopDetails")) {
    return (
      <div className="text-center my-5">
        <h5 className="text-danger">Access Denied</h5>
        <p className="text-muted">You don't have permission to access this section.</p>
      </div>
    );
  }
  
  return (
    <>
      {selectedEntity.isReady == false && (
        <h5 className="text-center">Work in Progress !</h5>
      )}
      {selectedEntity.name == "Customers" && (
        <AdminCustomers selectedEntity={selectedEntity} onNavigateToEntity={onNavigateToEntity} />
      )}
      {selectedEntity.name == "Enquiries" && (
        <AdminEnquiries 
          selectedEntity={selectedEntity} 
          onNavigateToEntity={onNavigateToEntity} 
          key={selectedEntity.filterParams?.customerId || "all"} 
        />
      )}
      {selectedEntity.name == "Measurements" && (
        <AdminMeasurements 
          selectedEntity={selectedEntity} 
          onNavigateToEntity={onNavigateToEntity} 
          key={selectedEntity.filterParams?.enquiryId || selectedEntity.filterParams?.customerId || "all"} 
        />
      )}
      {selectedEntity.name == "Quotations" && (
        <AdminQuotations 
          selectedEntity={selectedEntity} 
          user={user} 
          key={selectedEntity.filterParams?.measurementId || selectedEntity.filterParams?.enquiryId || selectedEntity.filterParams?.customerName || "all"} 
        />
      )}
      {selectedEntity.name == "Users" && (
        <AdminUsers selectedEntity={selectedEntity} user={user} />
      )}
      {selectedEntity.name == "Rates" && (
        <AdminRates selectedEntity={selectedEntity} user={user} onBackButtonClick={props.onBackButtonClick} />
      )}
      {selectedEntity.name == "Companies" && (
        <AdminCompanies selectedEntity={selectedEntity} onNavigateToEntity={onNavigateToEntity} />
      )}
      {selectedEntity.name == "Catalogs" && (
        <AdminCatalogs selectedEntity={selectedEntity} onNavigateToEntity={onNavigateToEntity} key={selectedEntity.filterParams?.companyId || "all"} />
      )}
      {selectedEntity.name == "ShopDetails" && (
        <AdminShopDetails selectedEntity={selectedEntity} user={user} onBackButtonClick={props.onBackButtonClick} />
      )}
      {selectedEntity.name == "Dustbins" && (
        <AdminDustbins selectedEntity={selectedEntity} user={user} />
      )}
      {selectedEntity.name == "Areas" && (
        <AdminAreas selectedEntity={selectedEntity} user={user} />
      )}
      {selectedEntity.name == "Drivers" && (
        <AdminDrivers selectedEntity={selectedEntity} user={user} />
      )}
      {selectedEntity.name == "Pickup Requests" && (
        <AdminPickupRequests selectedEntity={selectedEntity} user={user} />
      )}
      {selectedEntity.name == "Activity Report" && (
        <AdminReportActivities selectedEntity={selectedEntity} />
      )}
      {selectedEntity.name == "Curtain rate calculator" && (
        <AdminCurtainRateCalculator onBackButtonClick={props.onBackButtonClick} />
      )}
    </>
  );
}
