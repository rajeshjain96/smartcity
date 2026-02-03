export default function AdminMenus(props) {
  let { AdminManageMenus } = props;
  return (
    <ul className="list-unstyled text-start">
      {AdminManageMenus.map((menu, menuIndex) => (
        <li key={menuIndex} className="mb-3">
          <button
            className={`btn w-100 text-start py-3 fs-5 d-flex align-items-center justify-content-between ${
              selectedMenuIndex === menuIndex
                ? "btn-info text-white shadow-sm"
                : "btn-outline-primary menu-btn-hover" // Added custom class for hover
            }`}
            onClick={() => handleSideBarMenuClick(menuIndex)}
            disabled={!user}
          >
            <span>{menu.name + " aaba"}</span>
            <span className="ms-auto">
              {selectedMenuIndex === menuIndex ? (
                <i className="bi bi-chevron-up"></i>
              ) : (
                <i className="bi bi-chevron-down"></i>
              )}
            </span>
          </button>
          {selectedMenuIndex === menuIndex && (
            <ul className="list-unstyled ps-4 mt-2 border-start border-primary ms-2 pt-2 pb-1 rounded-sm bg-light animate__animated animate__fadeInLeft">
              {" "}
              {/* Added animation */}
              {menu.entities.map((entity, entityIndex) => (
                <li key={entityIndex} className="mb-2">
                  <button
                    className={`btn w-100 text-start btn-md ${
                      selectedEntityIndex === entityIndex
                        ? "btn-secondary text-white shadow-sm"
                        : "btn-outline-dark menu-btn-hover"
                    }`}
                    onClick={() => handleEntityClick(entityIndex)}
                    disabled={!user}
                  >
                    {entity.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
