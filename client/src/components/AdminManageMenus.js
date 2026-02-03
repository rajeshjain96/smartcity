let AdminManageMenus = {
  name: "Manage",
  accessLevel: "D",
  entities: [
    {
      name: "Areas",
      singularName: "Area",
      dbCollection: "areas",
      addFacility: true,
      deleteFacility: true,
      editFacility: true,
      isReady: true,
      accessLevel: "A",
    },
    {
      name: "Drivers",
      singularName: "Driver",
      dbCollection: "drivers",
      addFacility: true,
      deleteFacility: true,
      editFacility: true,
      isReady: true,
      accessLevel: "A",
    },
    {
      name: "Dustbins",
      singularName: "Dustbin",
      dbCollection: "dustbins",
      addFacility: true,
      deleteFacility: true,
      editFacility: true,
      isReady: true,
      accessLevel: "A",
    },
  ],
};
export default AdminManageMenus;
