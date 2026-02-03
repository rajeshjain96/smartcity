import React, { useState } from "react";
import "../SideBar.css";

export default function SideBar(props) {
  let { menus } = props;
  let { user } = props;
  let { flagToggleButton } = props;
  let { selectedMenuIndex } = props;
  let { selectedEntityIndex } = props;
  // let [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  // let [selectedEntityIndex, setSelectedEntityIndex] = useState(-1);
  function handleSideBarMenuClick(index) {
    props.onSideBarMenuClick(index);
  }
  function handleSideBarEntityClick(index) {
    // setSelectedEntityIndex(index);
    props.onEntityClick(index);
  }
  function toggleSidebar() {
    // console.log(flagToggleButton);

    // let flag = flagToggleButton;
    // flag = !flag;
    // setFlagToggleButton(flag);
    props.onToggleSidebar();
  }
  function handleLogInSignupButtonClick() {
    props.onLogInSignupButtonClick();
  }
  function handleSignoutClick() {
    props.onSignoutClick();
  }
  return (
    <>
      <button className="open-btn bg-primary " onClick={toggleSidebar}>
        ☰
      </button>
      <div
        className={
          "row bg-primary text-start sidebar " +
          (flagToggleButton ? "active" : "")
        }
      >
        <div className="col-12 my-4 text-center">
          <div className="my-3">
            <button className="close-btn" onClick={toggleSidebar}>
              ×
            </button>
          </div>
          {user &&
            menus.map((e, index) => (
              <React.Fragment key={index}>
                <div className="text-start">
                  {e.accessLevel >= user.level && (
                    <button
                      className={
                        "btn btn-sidebar my-1 border " +
                        (index == selectedMenuIndex
                          ? "bg-dark text-white"
                          : "bg-dark text-white")
                      }
                      onClick={() => {
                        handleSideBarMenuClick(index);
                      }}
                    >
                      {e.name}
                    </button>
                  )}
                </div>
                {selectedMenuIndex == index &&
                  e.entities.map((ee, indexx) => (
                    <div className="text-start" key={indexx}>
                      {ee.accessLevel >= user.level && (
                        <button
                          className={
                            "btn btn-sidebar ms-3 my-1 border " +
                            (indexx == selectedEntityIndex
                              ? "bg-white text-primary"
                              : "text-white")
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
