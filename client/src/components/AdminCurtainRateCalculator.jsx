import { useState, useEffect } from "react";
import axios from "./AxiosInstance";
import { fieldValidate } from "../utils/FormValidations";
import "../formstyles.css";

// Result Modal Component
function ResultModal({ result, onClose }) {
  useEffect(() => {
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowY = "scroll";
    };
  }, []);

  return (
    <>
      <div className="modal-wrapper" onClick={onClose} style={{ zIndex: 1040 }}></div>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", width: "90%" }}>
        <div className="text-bigger d-flex justify-content-between bg-primary text-white mb-3 p-2">
          <div>Calculation Result</div>
          <div onClick={onClose} style={{ cursor: "pointer" }}>
            <i className="bi bi-x-square"></i>
          </div>
        </div>
        <div className="my-3 p-3">
          <div style={{ textAlign: "left", padding: "10px" }}>
            {/* Dimensions */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Dimensions:</strong> {result.height} x {result.width}
            </div>

            {/* Type */}
            <div style={{ marginBottom: "15px" }}>
              <strong>Type:</strong> {result.curtainType}
            </div>

            {/* Catalog No. - Don't show for Blinds */}
            {result.curtainType !== "Blinds" && (
              <div style={{ marginBottom: "15px" }}>
                <strong>Catalog No.:</strong> {result.catalogNumber} {result.companyName && `(${result.companyName})`}
              </div>
            )}

            <hr style={{ margin: "20px 0", borderTop: "1px dashed #ccc" }} />

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ textAlign: "left", padding: "8px", width: "30%" }}>Item</th>
                  <th style={{ textAlign: "left", padding: "8px", width: "30%" }}>Rate</th>
                  <th style={{ textAlign: "right", padding: "8px", width: "40%" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Cloth */}
                {result.clothRequired > 0 && result.clothRatePerMeter > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.clothRequired} meter - Cloth</td>
                    <td style={{ padding: "8px" }}>Rs. {result.clothRatePerMeter} per meter</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.clothCharges}/-</td>
                  </tr>
                )}

                {/* Astar */}
                {result.astarRequired > 0 && result.astarCharges > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.astarRequired} meter - Astar</td>
                    <td style={{ padding: "8px" }}>Rs. {result.astarRate}/- per meter</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.astarCharges}/-</td>
                  </tr>
                )}

                {/* Stitching */}
                {result.curtainType === "AP" && result.platesRequired > 0 && result.stitchingCharges > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.platesRequired} plates - stitching</td>
                    <td style={{ padding: "8px" }}>Rs. {result.stitchingRate}/- per plate</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.stitchingCharges}/-</td>
                  </tr>
                )}
                {result.curtainType === "Roman" && result.stitchingArea > 0 && result.stitchingCharges > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.stitchingArea} sq.ft - stitching</td>
                    <td style={{ padding: "8px" }}>Rs. {result.stitchingRate}/- per sq.ft</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.stitchingCharges}/-</td>
                  </tr>
                )}

                {/* Blinds - curtain cost */}
                {result.curtainType === "Blinds" && result.stitchingArea > 0 && result.blindsCharges > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.stitchingArea} sq.ft - curtain cost</td>
                    <td style={{ padding: "8px" }}>Rs. {result.blindsRate}/- per sq.ft</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.blindsCharges}/-</td>
                  </tr>
                )}

                {/* Track */}
                {result.track > 0 && result.trackCharges > 0 && (
                  <tr style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{result.track} feet - track</td>
                    <td style={{ padding: "8px" }}>Rs. {result.trackRate}/- running feet</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>Rs. {result.trackCharges}/-</td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr style={{ margin: "20px 0", borderTop: "1px solid #ccc" }} />

            {/* Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "18px", fontWeight: "bold", padding: "10px" }}>
              <span>Total</span>
              <span>Rs. {result.total}/-</span>
            </div>
          </div>
        </div>
        <div className="text-center mb-3">
          <button className="btn btn-primary mx-1" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdminCurtainRateCalculator(props) {
  const [curtainType, setCurtainType] = useState("");
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [companyList, setCompanyList] = useState([]);
  const [catalogList, setCatalogList] = useState([]);
  const [filteredCatalogList, setFilteredCatalogList] = useState([]);
  const [ratesData, setRatesData] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);
  const [flagLoad, setFlagLoad] = useState(false);
  const [message, setMessage] = useState("");
  
  // Validations object
  const calculatorValidations = {
    curtainType: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false
    },
    height: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false
    },
    width: {
      message: "",
      mxLen: 20,
      mnLen: 1,
      onlyDigits: false
    },
    companyId: {
      message: "",
      mxLen: 50,
      mnLen: 1,
      onlyDigits: false
    },
    catalogId: {
      message: "",
      mxLen: 50,
      mnLen: 1,
      onlyDigits: false
    }
  };
  
  const [errorCalculator, setErrorCalculator] = useState(calculatorValidations);
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    // Clear company and catalog when switching to Blinds
    if (curtainType === "Blinds") {
      setCompanyId("");
      setCatalogId("");
      setFilteredCatalogList([]);
      // Clear error messages for company and catalog when switching to Blinds
      const errCalc = { ...errorCalculator };
      errCalc.companyId.message = "";
      errCalc.catalogId.message = "";
      setErrorCalculator(errCalc);
    } else {
      // Filter catalogs based on selected company
      if (companyId) {
        const filtered = catalogList.filter(catalog => catalog.companyId === companyId);
        setFilteredCatalogList(filtered);
        // Reset catalog selection if current selection is not in filtered list
        if (catalogId && !filtered.find(c => c._id === catalogId)) {
          setCatalogId("");
        }
      } else {
        setFilteredCatalogList([]);
        setCatalogId("");
      }
    }
  }, [curtainType, companyId, catalogList, catalogId]);

  async function getData() {
    setFlagLoad(true);
    try {
      // Fetch companies
      let companiesResponse = await axios("/companies");
      let companiesData = await companiesResponse.data;
      setCompanyList(companiesData);

      // Fetch catalogs
      let catalogsResponse = await axios("/catalogs");
      let catalogsData = await catalogsResponse.data;
      setCatalogList(catalogsData);

      // Fetch rates
      let ratesResponse = await axios("/rates");
      let ratesList = await ratesResponse.data;
      if (ratesList && ratesList.length > 0) {
        setRatesData(ratesList[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage("Error loading data. Please refresh the page.");
    }
    setFlagLoad(false);
  }

  function showMessage(msg) {
    setMessage(msg);
    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function handleTextFieldChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    
    if (name === "height") {
      setHeight(value);
    } else if (name === "width") {
      setWidth(value);
    }
    
    // Validate the field
    const message = fieldValidate(event, errorCalculator);
    const errCalc = { ...errorCalculator };
    if (errCalc[name]) {
      errCalc[name].message = message;
      setErrorCalculator(errCalc);
    }
  }

  function handleSelectChange(event) {
    const name = event.target.name;
    const value = event.target.value;
    
    if (name === "curtainType") {
      setCurtainType(value);
    } else if (name === "companyId") {
      setCompanyId(value);
    } else if (name === "catalogId") {
      setCatalogId(value);
    }
    
    // Validate the field
    const message = fieldValidate(event, errorCalculator);
    const errCalc = { ...errorCalculator };
    if (errCalc[name]) {
      errCalc[name].message = message;
      setErrorCalculator(errCalc);
    }
  }

  function handleBlur(event) {
    const name = event.target.name;
    const message = fieldValidate(event, errorCalculator);
    const errCalc = { ...errorCalculator };
    if (errCalc[name]) {
      errCalc[name].message = message;
      setErrorCalculator(errCalc);
    }
  }

  function handleFocus(event) {
    // Clear any banner messages when user focuses on a field
    setMessage("");
  }

  function checkAllErrors() {
    // Check if any field has an error message
    for (let field in errorCalculator) {
      if (errorCalculator[field].message !== "") {
        return true;
      }
    }
    
    // Check required fields
    const errCalc = { ...errorCalculator };
    let flag = false;
    
    if (!curtainType) {
      errCalc.curtainType.message = "Required...";
      flag = true;
    }
    if (!height) {
      errCalc.height.message = "Required...";
      flag = true;
    }
    if (!width) {
      errCalc.width.message = "Required...";
      flag = true;
    }
    
    // For non-Blinds types, require company and catalog
    if (curtainType !== "Blinds") {
      if (!companyId) {
        errCalc.companyId.message = "Required...";
        flag = true;
      }
      if (!catalogId) {
        errCalc.catalogId.message = "Required...";
        flag = true;
      }
    } else {
      // Clear company and catalog errors for Blinds
      errCalc.companyId.message = "";
      errCalc.catalogId.message = "";
    }
    
    if (flag) {
      setErrorCalculator(errCalc);
      return true;
    }
    return false;
  }

  function calculateCharges() {
    setHasValidated(true);
    
    // Check for rates data
    if (!ratesData) {
      showMessage("Rates data is not loaded. Please refresh the page.");
      return;
    }
    
    // Validate all fields
    if (checkAllErrors()) {
      return;
    }

    const heightNum = parseFloat(height);
    const widthNum = parseFloat(width);

    // Additional validation for numeric values
    if (isNaN(heightNum) || heightNum <= 0) {
      const errCalc = { ...errorCalculator };
      errCalc.height.message = "Please enter a valid value (greater than 0)";
      setErrorCalculator(errCalc);
      return;
    }
    if (isNaN(widthNum) || widthNum <= 0) {
      const errCalc = { ...errorCalculator };
      errCalc.width.message = "Please enter a valid value (greater than 0)";
      setErrorCalculator(errCalc);
      return;
    }

    let clothRequired = 0;
    let astarRequired = 0;
    let track = 0;
    let platesRequired = 0;
    let stitchingArea = 0;
    let clothMultiplier = 0;
    let clothRatePerMeter = 0;
    let clothCharges = 0;
    let astarCharges = 0;
    let stitchingCharges = 0;
    let trackCharges = 0;
    let blindsCharges = 0;

    // Calculate based on curtain type
    if (curtainType === "AP") {
      // Get catalog price for AP
      const catalog = catalogList.find(c => c._id === catalogId);
      if (!catalog || !catalog.priceInRs) {
        showMessage("Selected catalog not found or has no price");
        return;
      }
      clothRatePerMeter = Math.round(parseFloat(catalog.priceInRs));

      platesRequired = Math.ceil(widthNum / 21);
      clothRequired = Math.ceil(((heightNum + 12) / 36) * platesRequired);
      astarRequired = clothRequired;
      track = Math.ceil(widthNum / 12);

      // Calculate charges for AP
      clothCharges = Math.round(clothRequired * clothRatePerMeter);
      const astarRate = parseFloat(ratesData.astarStitchingRate) || 0;
      astarCharges = Math.round(astarRequired * astarRate);
      const perPlateRate = parseFloat(ratesData.perPlateStitchingRate) || 0;
      stitchingCharges = Math.round(platesRequired * perPlateRate);
      const trackRate = parseFloat(ratesData.trackRatePerRunningFeet) || 0;
      trackCharges = Math.round(track * trackRate);
    } else if (curtainType === "Roman") {
      // Helper function to round to 0.5 or next integer for Roman curtains
      const roundToHalfOrInteger = (value) => {
        const floor = Math.floor(value);
        const decimal = value - floor;
        if (decimal <= 0.5) {
          return floor + 0.5;
        } else {
          return floor + 1;
        }
      };
      
      // Get catalog price for Roman
      const catalog = catalogList.find(c => c._id === catalogId);
      if (!catalog || !catalog.priceInRs) {
        showMessage("Selected catalog not found or has no price");
        return;
      }
      clothRatePerMeter = Math.round(parseFloat(catalog.priceInRs));

      const panna = 48;
      clothMultiplier = Math.round(widthNum / (panna - 4));
      clothRequired = roundToHalfOrInteger(((heightNum + 15) / 36) * clothMultiplier);
      astarRequired = clothRequired;
      track = Math.ceil(widthNum / 12);
      stitchingArea = Math.ceil((widthNum * heightNum) / 144);

      // Calculate charges for Roman
      clothCharges = Math.round(clothRequired * clothRatePerMeter);
      const astarRate = parseFloat(ratesData.astarStitchingRate) || 0;
      astarCharges = Math.round(astarRequired * astarRate);
      const perSqFtRate = parseFloat(ratesData.perSqFtStitchingRate) || 0;
      stitchingCharges = Math.round(stitchingArea * perSqFtRate);
      const trackRate = parseFloat(ratesData.trackRatePerRunningFeet) || 0;
      trackCharges = Math.round(track * trackRate);
    } else if (curtainType === "Blinds") {
      // Blinds calculation: sq.ft = (height x width) / 144, rounded integer
      if (!isNaN(heightNum) && heightNum > 0 && !isNaN(widthNum) && widthNum > 0) {
        stitchingArea = Math.round((widthNum * heightNum) / 144);
      }

      // Calculate blinds charges = sq.ft × Blinds per sq. ft. rate
      const blindsRate = Math.round(parseFloat(ratesData.blindsPerSqFtRate || 0));
      if (stitchingArea > 0 && blindsRate > 0) {
        blindsCharges = Math.round(stitchingArea * blindsRate);
      }
    }

    const total = curtainType === "Blinds"
      ? blindsCharges
      : clothCharges + astarCharges + stitchingCharges + trackCharges;

    // Prepare result
    const result = {
      curtainType,
      height: heightNum,
      width: widthNum,
      companyName: curtainType !== "Blinds" ? (companyList.find(c => c._id === companyId)?.name || "") : "",
      catalogNumber: curtainType !== "Blinds" ? (catalogList.find(c => c._id === catalogId)?.number || "") : "",
      clothRequired,
      astarRequired,
      track,
      platesRequired,
      stitchingArea,
      clothMultiplier,
      clothRatePerMeter,
      astarRate: curtainType !== "Blinds" ? Math.round((parseFloat(ratesData.astarStitchingRate) || 0) * 100) / 100 : 0,
      stitchingRate: curtainType === "AP" 
        ? Math.round(parseFloat(ratesData.perPlateStitchingRate || 0) * 100) / 100
        : curtainType === "Roman"
        ? Math.round(parseFloat(ratesData.perSqFtStitchingRate || 0) * 100) / 100
        : 0,
      trackRate: curtainType !== "Blinds" ? Math.round((parseFloat(ratesData.trackRatePerRunningFeet) || 0) * 100) / 100 : 0,
      blindsRate: curtainType === "Blinds" ? Math.round(parseFloat(ratesData.blindsPerSqFtRate || 0)) : 0,
      clothCharges,
      astarCharges,
      stitchingCharges,
      trackCharges,
      blindsCharges,
      total
    };

    setCalculationResult(result);
    setShowResultModal(true);
  }

  function handleModalClose() {
    setShowResultModal(false);
  }


  if (flagLoad) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          {message && (
            <div className="alert alert-warning py-1 px-3 my-1 mx-auto text-center rounded-pill shadow-sm small message-banner">
              {message}
            </div>
          )}
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0 text-center">Curtain Rate Calculator</h4>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); calculateCharges(); }}>
                {/* Curtain Type */}
                <div className="mb-3">
                  <label htmlFor="curtainType" className="form-label">Curtain Type *</label>
                  <select
                    id="curtainType"
                    name="curtainType"
                    className="form-control"
                    value={curtainType}
                    onChange={handleSelectChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                  >
                    <option value="">Select Curtain Type</option>
                    <option value="AP">AP</option>
                    <option value="Roman">Roman</option>
                    <option value="Blinds">Blinds</option>
                  </select>
                  <div className="">
                    {errorCalculator.curtainType.message ? (
                      <span className="form-error-message">
                        <i className="bi bi-exclamation-circle"></i>
                        {errorCalculator.curtainType.message}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Height */}
                <div className="mb-3">
                  <label htmlFor="height" className="form-label">Height (inches) *</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    className="form-control"
                    value={height}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    step="0.01"
                    min="0"
                  />
                  <div className="">
                    {errorCalculator.height.message ? (
                      <span className="form-error-message">
                        <i className="bi bi-exclamation-circle"></i>
                        {errorCalculator.height.message}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Width */}
                <div className="mb-3">
                  <label htmlFor="width" className="form-label">Width (inches) *</label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    className="form-control"
                    value={width}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    step="0.01"
                    min="0"
                  />
                  <div className="">
                    {errorCalculator.width.message ? (
                      <span className="form-error-message">
                        <i className="bi bi-exclamation-circle"></i>
                        {errorCalculator.width.message}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Company - Only show for non-Blinds types */}
                {curtainType !== "Blinds" && (
                  <div className="mb-3">
                    <label htmlFor="companyId" className="form-label">Company Name *</label>
                    <select
                      id="companyId"
                      name="companyId"
                      className="form-control"
                      value={companyId}
                      onChange={handleSelectChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                    >
                      <option value="">Select Company</option>
                      {companyList.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <div className="">
                      {errorCalculator.companyId.message ? (
                        <span className="form-error-message">
                          <i className="bi bi-exclamation-circle"></i>
                          {errorCalculator.companyId.message}
                        </span>
                      ) : null}
                      {companyId && !errorCalculator.companyId.message && (
                        filteredCatalogList.length === 0 ? (
                          <span className="form-error-message" style={{ color: "#856404" }}>
                            <i className="bi bi-info-circle"></i>
                            No catalogs of this company
                          </span>
                        ) : (
                          <span className="form-error-message" style={{ color: "#155724" }}>
                            <i className="bi bi-check-circle"></i>
                            {filteredCatalogList.length} {filteredCatalogList.length === 1 ? 'catalog' : 'catalogs'} available
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Catalog - Only show for non-Blinds types */}
                {curtainType !== "Blinds" && (
                  <div className="mb-3">
                    <label htmlFor="catalogId" className="form-label">Catalog *</label>
                    <select
                      id="catalogId"
                      name="catalogId"
                      className="form-control"
                      value={catalogId}
                      onChange={handleSelectChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      disabled={!companyId}
                    >
                      <option value="">{companyId ? "Select Catalog" : "Select Company First"}</option>
                      {filteredCatalogList.map((catalog) => (
                        <option key={catalog._id} value={catalog._id}>
                          {catalog.number} - Rs. {Math.round(parseFloat(catalog.priceInRs || 0))} per meter
                        </option>
                      ))}
                    </select>
                    <div className="">
                      {errorCalculator.catalogId.message ? (
                        <span className="form-error-message">
                          <i className="bi bi-exclamation-circle"></i>
                          {errorCalculator.catalogId.message}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Submit and Cancel Buttons */}
                <div className="text-center mt-4 d-flex gap-2 justify-content-center">
                  <button type="submit" className="btn btn-primary btn-lg">
                    Calculate
                  </button>
                  {props.onBackButtonClick && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-lg"
                      onClick={() => props.onBackButtonClick()}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && calculationResult && (
        <ResultModal
          result={calculationResult}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
