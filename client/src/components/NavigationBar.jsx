import { useEntityAction } from "../contexts/EntityActionContext";

export default function NavigationBar(props) {
  const { user, onHomeClick, onSignoutClick, currentPage } = props;
  const { action, onListClick } = useEntityAction();

  function handleHomeClick(e) {
    e.preventDefault();
    if (onHomeClick) {
      onHomeClick();
    }
  }

  function handleSignoutClick(e) {
    e.preventDefault();
    if (onSignoutClick) {
      onSignoutClick();
    }
  }

  function handleBackToListClick(e) {
    e.preventDefault();
    if (onListClick) {
      onListClick();
    }
  }

  // Don't show navigation bar on home page
  if (!currentPage || currentPage === "home") {
    return null;
  }

  return (
    <nav className="app-navbar">
      <div className="app-navbar-container">
        <button
          className="app-navbar-home-btn"
          onClick={handleHomeClick}
          title="Go to Home"
        >
          <i className="bi bi-house-door-fill"></i>
          <span className="app-navbar-home-text">Home</span>
        </button>
        
        <div className="app-navbar-title">
          <span className="app-navbar-page-name">{currentPage}</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {(action === "add" || action === "update") && (
            <button
              className="app-navbar-back-btn"
              onClick={handleBackToListClick}
              title="Back to List"
            >
              <i className="bi bi-arrow-left-circle"></i>
              <span className="app-navbar-back-text">Back to List</span>
            </button>
          )}

          {user && (
            <div className="app-navbar-user">
              <div className="app-navbar-user-info">
                <i className="bi bi-person-circle me-1"></i>
                <span className="app-navbar-user-name">{user.name || user.emailId}</span>
              </div>
              <button
                className="app-navbar-signout-btn"
                onClick={handleSignoutClick}
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}



