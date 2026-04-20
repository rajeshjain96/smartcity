import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";
import PickupRequestForm from "./PickupRequestForm";

export default function ResidentPickupRequests(props) {
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState([]);
  const [dustbinList, setDustbinList] = useState([]);
  const [action, setAction] = useState("list");
  const [flagLoad, setFlagLoad] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = props;

  function getApiOrigin() {
    const base = axios?.defaults?.baseURL ? String(axios.defaults.baseURL) : "";
    // expected: http://localhost:3005/api
    return base.endsWith("/api") ? base.slice(0, -4) : base;
  }

  useEffect(() => {
    getData();
    getDustbins();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/pickupRequests");
      let list = await response.data;
      list = list.sort((a, b) => new Date(b.addDate) - new Date(a.addDate));
      setRequestList(list);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, please login again");
      } else {
        showMessage("Error loading pickup requests");
      }
    }
    setFlagLoad(false);
  }

  const getDataRef = useRef(getData);
  getDataRef.current = getData;

  useEffect(() => {
    const onRefresh = () => {
      getDataRef.current();
    };
    window.addEventListener("residentPickupRefresh", onRefresh);
    return () => window.removeEventListener("residentPickupRefresh", onRefresh);
  }, []);

  async function getDustbins() {
    try {
      let response = await axios("/dustbins");
      let list = await response.data;
      setDustbinList(list);
    } catch (error) {
      console.log("Error fetching dustbins:", error);
    }
  }

  async function handleFormSubmit(request, imageFile) {
    setFlagLoad(true);
    try {
      // Remove address from request if it exists (backend will derive from dustbin)
      const requestToSend = { ...request };
      delete requestToSend.address;

      const formData = new FormData();
      Object.entries(requestToSend).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let response = await axios.post("/pickupRequests", formData, {
        headers: { "Content-type": "multipart/form-data" }
      });

      showMessage("Pickup request submitted successfully!");
      setAction("list");
      // Re-fetch so we always show latest detectedLevel / retry results
      await getDataRef.current();
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        showMessage("Session expired, please login again");
      } else {
        showMessage("Failed to submit pickup request");
      }
    }
    setFlagLoad(false);
  }

  async function handleCancelRequest(request) {
    if (!window.confirm(`Cancel pickup request for ${request.garbageType}?`)) {
      return;
    }
    
    setFlagLoad(true);
    try {
      let updateObj = {
        _id: request._id,
        status: "Cancelled"
      };
      
      let response = await axios.put("/pickupRequests", updateObj, {
        headers: { "Content-type": "multipart/form-data" }
      });
      
      showMessage("Request cancelled successfully");
      await getData();
    } catch (error) {
      console.log(error);
      showMessage("Failed to cancel request");
    }
    setFlagLoad(false);
  }

  function handleFormCloseClick() {
    setAction("list");
  }

  function handleNewRequestClick() {
    setAction("add");
  }

  function showMessage(msg) {
    setMessage(msg);
    window.setTimeout(() => {
      setMessage("");
    }, 4000);
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Pending": return "badge bg-warning text-dark";
      case "Assigned": return "badge bg-info text-dark";
      case "InProgress": return "badge bg-primary";
      case "Collected": return "badge bg-success";
      case "Cancelled": return "badge bg-secondary";
      default: return "badge bg-secondary";
    }
  }

  if (flagLoad) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>My Pickup Requests</h3>
        {action === "list" && (
          <button className="btn btn-primary" onClick={handleNewRequestClick}>
            <i className="bi bi-plus-lg me-2"></i>New Pickup Request
          </button>
        )}
      </div>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      {action === "add" && (
        <PickupRequestForm
          dustbinList={dustbinList}
          onFormSubmit={handleFormSubmit}
          onFormCloseClick={handleFormCloseClick}
        />
      )}

      {action === "list" && (
        <div>
          {requestList.length === 0 ? (
            <div className="text-center my-5">
              <p className="text-muted">No pickup requests yet</p>
              <button className="btn btn-primary" onClick={handleNewRequestClick}>
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="row">
              {requestList.map((request) => (
                <div key={request._id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">{request.garbageType}</h6>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status}
                        </span>
                      </div>
                      
                      <p className="card-text small text-muted mb-2">
                        <i className="bi bi-calendar me-1"></i>
                        {new Date(request.addDate).toLocaleDateString()}
                      </p>
                      
                      {request.address && (
                        <p className="card-text small mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {request.address}
                        </p>
                      )}
                      
                      {request.notes && (
                        <p className="card-text small mb-2">
                          <i className="bi bi-sticky me-1"></i>
                          {request.notes}
                        </p>
                      )}

                      {request.requestImage && (
                        <div className="mb-2">
                          <img
                            src={getApiOrigin() + "/api/uploadedImages/" + request.requestImage}
                            alt="Uploaded dustbin"
                            style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
                            onError={(e) => {
                              // hide broken image icon
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {request.detectedLevel && (
                        <p className="card-text small mb-2">
                          <strong>Detected Level:</strong> {request.detectedLevel}
                        </p>
                      )}
                      {!request.detectedLevel && request.requestImage && (
                        <p className="card-text small text-muted mb-2">
                          <strong>Detected Level:</strong> Unavailable
                        </p>
                      )}
                      {request.detectionError && (
                        <p className="card-text small text-muted mb-2">
                          <strong>AI:</strong> {request.detectionError}
                        </p>
                      )}
                      
                      {request.collectedAt && (
                        <p className="card-text small text-success mb-2">
                          <i className="bi bi-check-circle me-1"></i>
                          Collected: {new Date(request.collectedAt).toLocaleString()}
                        </p>
                      )}
                      
                      {request.status === "Pending" && (
                        <button 
                          className="btn btn-sm btn-outline-danger mt-2"
                          onClick={() => handleCancelRequest(request)}
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
