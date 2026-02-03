import React, { useState } from "react";

const CheckboxToggle = () => {
  const [selectedValues, setSelectedValues] = useState([]);
  const options = [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Option 5",
    "Option 6",
  ];

  const handleToggle = (value) => {
    setSelectedValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  return (
    <div className="container mt-4">
      {/* --- DESKTOP VIEW --- */}
      {/* Hidden on mobile, Flex row on Medium screens and up */}
      <div className="row d-none d-md-flex border p-3 rounded">
        {options.map((option) => (
          <div key={option} className="col-2">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`check-${option}`}
                checked={selectedValues.includes(option)}
                onChange={() => handleToggle(option)}
              />
              <label className="form-check-label" htmlFor={`check-${option}`}>
                {option}
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* --- MOBILE VIEW --- */}
      {/* Block display on mobile, Hidden on Medium screens and up */}
      <div className="d-block d-md-none">
        <label className="form-label font-weight-bold">Select Options:</label>
        <select
          className="form-select"
          value=""
          onChange={(e) => handleToggle(e.target.value)}
        >
          <option value="" disabled>
            Choose options...
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option} {selectedValues.includes(option) ? "✓" : ""}
            </option>
          ))}
        </select>

        {/* Helper to show what is selected on mobile */}
        <div className="mt-2">
          {selectedValues.map((val) => (
            <span key={val} className="badge bg-primary me-1">
              {val}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckboxToggle;
