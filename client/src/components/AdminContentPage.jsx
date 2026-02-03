import AdminUsers from "./AdminUsers";
import AdminDustbins from "./AdminDustbins";
import AdminAreas from "./AdminAreas";
import AdminDrivers from "./AdminDrivers";
import AdminPickupRequests from "./AdminPickupRequests";
export default function ContentPage(props) {
  let { selectedEntity } = props;
  let { user } = props;
  let { onNavigateToEntity } = props;
  
  // Block staff users from accessing Users (if needed in future)
  if (user && user.role === "staff" && selectedEntity.name === "Users") {
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
      {selectedEntity.name == "Users" && (
        <AdminUsers selectedEntity={selectedEntity} user={user} />
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
    </>
  );
}
