let AdminReportMenus = {
  accessLevel: "D",
  name: "Reports",
  entities: [
    {
      name: "Activity Report",
      singularName: "Activity",
      dbCollection: "activities",
      addFacility: true,
      deleteFacility: true,
      editFacility: true,
      accessLevel: "A",
    },
  ],
};
export default AdminReportMenus;