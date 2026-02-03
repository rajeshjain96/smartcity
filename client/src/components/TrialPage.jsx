import  { useState } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";

export default function TrialPage() {
  const [theme, setTheme] = useState("primary");
  const [mode, setMode] = useState("gallery"); // gallery | single
  const [layout, setLayout] = useState("stacked");

  const btnClass = `btn btn-${theme}`;
  const cardStyle = `bg-white p-4 rounded-4 shadow-sm border border-${theme} mb-3`;

  // Shared fields
  const fields = (
    <>
      <div className="mb-3">
        <label className="form-label fw-semibold">Name</label>
        <input type="text" className="form-control" placeholder="Enter name" />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Email</label>
        <input type="email" className="form-control" placeholder="Enter email" />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Password</label>
        <input type="password" className="form-control" placeholder="Enter password" />
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Gender</label>
        <select className="form-select">
          <option>Male</option>
          <option>Female</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label fw-semibold">Message</label>
        <textarea className="form-control" rows="2"></textarea>
      </div>
    </>
  );

  // Different layouts
  const renderLayout = (type) => {
    switch (type) {
      case "stacked":
        return (
          <div className={cardStyle}>
            <h5 className={`text-${theme} mb-3`}>Stacked Form</h5>
            <form>
              {fields}
              <button type="submit" className={`${btnClass} shadow`}>Submit</button>
            </form>
          </div>
        );

      case "two-column":
        return (
          <div className={cardStyle}>
            <h5 className={`text-${theme} mb-3`}>Two Column Form</h5>
            <form>
              <div className="row">
                <div className="col-md-6">{fields.props.children[0]}</div>
                <div className="col-md-6">{fields.props.children[1]}</div>
              </div>
              <div className="row">
                <div className="col-md-6">{fields.props.children[2]}</div>
                <div className="col-md-6">{fields.props.children[3]}</div>
              </div>
              {fields.props.children[4]}
              <button type="submit" className={`${btnClass} shadow`}>Submit</button>
            </form>
          </div>
        );

      case "card":
        return (
          <div className="d-flex justify-content-center">
            <div className={`${cardStyle} shadow-lg`} style={{ maxWidth: "420px" }}>
              <h5 className={`text-center text-${theme} mb-3`}>Card Form</h5>
              <form>
                {fields}
                <button type="submit" className={`${btnClass} w-100 shadow`}>Submit</button>
              </form>
            </div>
          </div>
        );

      case "horizontal":
        return (
          <div className={cardStyle}>
            <h5 className={`text-${theme} mb-3`}>Horizontal Form</h5>
            <form>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label fw-semibold">Name</label>
                <div className="col-sm-9">{fields.props.children[0].props.children[1]}</div>
              </div>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label fw-semibold">Email</label>
                <div className="col-sm-9">{fields.props.children[1].props.children[1]}</div>
              </div>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label fw-semibold">Password</label>
                <div className="col-sm-9">{fields.props.children[2].props.children[1]}</div>
              </div>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label fw-semibold">Gender</label>
                <div className="col-sm-9">{fields.props.children[3].props.children[1]}</div>
              </div>
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label fw-semibold">Message</label>
                <div className="col-sm-9">{fields.props.children[4].props.children[1]}</div>
              </div>
              <button type="submit" className={`${btnClass} shadow`}>Submit</button>
            </form>
          </div>
        );

      case "inline":
        return (
          <div className={cardStyle}>
            <h5 className={`text-${theme} mb-3`}>Inline Form</h5>
            <form className="d-flex flex-wrap gap-2 align-items-center">
              <input type="text" className="form-control w-auto" placeholder="Name" />
              <input type="email" className="form-control w-auto" placeholder="Email" />
              <input type="password" className="form-control w-auto" placeholder="Password" />
              <select className="form-select w-auto">
                <option>Male</option>
                <option>Female</option>
              </select>
              <button type="submit" className={`${btnClass} shadow`}>Go</button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container py-4">
      {/* Controls */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label fw-bold">Mode</label>
          <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="gallery">Gallery View</option>
            <option value="single">Single Layout</option>
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-bold">Theme</label>
          <select className="form-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="primary">Blue (Primary)</option>
            <option value="success">Green (Success)</option>
            <option value="danger">Red (Danger)</option>
            <option value="dark">Black (Dark)</option>
          </select>
        </div>

        {mode === "single" && (
          <div className="col-md-4">
            <label className="form-label fw-bold">Layout</label>
            <select className="form-select" value={layout} onChange={(e) => setLayout(e.target.value)}>
              <option value="stacked">Stacked</option>
              <option value="two-column">Two Column</option>
              <option value="card">Card</option>
              <option value="horizontal">Horizontal</option>
              <option value="inline">Inline</option>
            </select>
          </div>
        )}
      </div>

      {/* Render */}
      {mode === "gallery" ? (
        <div className="row g-4">
          <div className="col-md-6">{renderLayout("stacked")}</div>
          <div className="col-md-6">{renderLayout("two-column")}</div>
          <div className="col-md-6">{renderLayout("card")}</div>
          <div className="col-md-6">{renderLayout("horizontal")}</div>
          <div className="col-md-12">{renderLayout("inline")}</div>
        </div>
      ) : (
        <div className="d-flex justify-content-center">{renderLayout(layout)}</div>
      )}
    </div>
  );
}
