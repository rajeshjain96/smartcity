let AdminReportMenus = {
  accessLevel: "D",
  name: "Reports",
  entities: [
    {
      name: "Collection Reports",
      singularName: "Collection Report",
      dbCollection: "pickupRequests",
      addFacility: false,
      deleteFacility: false,
      editFacility: false,
      isReady: false,
      accessLevel: "A",
    },
    {
      name: "Area-wise Reports",
      singularName: "Area Report",
      dbCollection: "pickupRequests",
      addFacility: false,
      deleteFacility: false,
      editFacility: false,
      isReady: false,
      accessLevel: "A",
    },
    {
      name: "Driver Performance",
      singularName: "Driver Performance",
      dbCollection: "pickupRequests",
      addFacility: false,
      deleteFacility: false,
      editFacility: false,
      isReady: false,
      accessLevel: "A",
    },
  ],
};
export default AdminReportMenus;