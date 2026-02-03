let AdminOperationsMenus = {
  name: "Operations",
  accessLevel: "D",
  entities: [
    {
      name: "Pickup Requests",
      singularName: "Pickup Request",
      dbCollection: "pickupRequests",
      addFacility: false,
      deleteFacility: true,
      editFacility: true,
      isReady: true,
      accessLevel: "A",
    },
  ],
};
export default AdminOperationsMenus;
