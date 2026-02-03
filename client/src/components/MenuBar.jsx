import React from "react";

export default function MenuBar(props) {
  let { menus } = props;
  let { user } = props;
  let { selectedMenuIndex } = props;
  let { selectedEntityIndex } = props;
  function handleSideBarMenuClick(index) {
    props.onSideBarMenuClick(index);
  }
  function handleSideBarEntityClick(index) {
    // setSelectedEntityIndex(index);
    props.onEntityClick(index);
  }
  function handleLogInSignupButtonClick() {
    props.onLogInSignupButtonClick();
  }
  function handleSignoutClick() {
    props.onSignoutClick();
  }
  function handleLogoutClick() {
    props.onLogoutClick();
  }
  return (
    <>
      <div className={"row justify-content-center text-start  "}>
        {user && (
          <div className="text-center">
            {" "}
            <div>
              Welcome {user.name || user.emailId} &nbsp;
              <span className="text-bigger">
                <a href="#" onClick={handleLogoutClick}>
                  Logout
                </a>
              </span>
            </div>
            {user.shopurl && user.role && (
              <div className="text-muted small mt-1">
                {user.shopurl} ({user.role})
              </div>
            )}
          </div>
        )}
        <div className="col-8 my-4 text-center">
          {user &&
            menus.map((e, index) => (
              <React.Fragment key={index}>
                <div className="text-start my-3">
                  <button
                    className={
                      "btn my-1 border " +
                      (index == selectedMenuIndex
                        ? "btn-darkcolor"
                        : "btn-lightcolor")
                    }
                    style={{ width: "100%" }}
                    onClick={() => {
                      handleSideBarMenuClick(index);
                    }}
                  >
                    {e.name}
                  </button>
                </div>
                {selectedMenuIndex == index &&
                  e.entities.map((ee, indexx) => (
                    <div className="text-center my-3" key={indexx}>
                      {ee.accessLevel >= user.level && (
                        <button
                          className={
                            " my-1 " +
                            (indexx == selectedEntityIndex
                              ? "btn-lightcolor"
                              : "btn-darkcolor")
                          }
                          onClick={() => {
                            handleSideBarEntityClick(indexx);
                          }}
                        >
                          {ee.name}
                        </button>
                      )}
                    </div>
                  ))}
              </React.Fragment>
            ))}
          {user && (
            <>
              {" "}
              <div className="text-center">
                <a
                  href="#"
                  style={{ color: "white" }}
                  onClick={handleSignoutClick}
                >
                  Signout
                </a>
              </div>
            </>
          )}
          {!user && (
            <>
              {" "}
              <div className="text-start">
                <button
                  className={"btn btn-sidebar ms-3 my-2 border "}
                  onClick={handleLogInSignupButtonClick}
                >
                  LogIn / Signup
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
