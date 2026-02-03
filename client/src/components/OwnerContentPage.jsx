import OwnerShops from "./OwnerShops";
import AdminReportActivities from "./AdminReportActivities";
export default function OwnerContentPage(props) {
  let { selectedEntity } = props;
  let { user } = props;
  return (
    <>
      {selectedEntity.isReady == false && (
        <h5 className="text-center">Work in Progress !</h5>
      )}
      {selectedEntity.name == "Shops" && (
        <OwnerShops selectedEntity={selectedEntity} />
      )}
      {selectedEntity.name == "Activity Report" && (
        <AdminReportActivities selectedEntity={selectedEntity} />
      )}
    </>
  );
}
