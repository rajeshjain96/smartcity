import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function DriverPickupRequests(props) {
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [flagLoad, setFlagLoad] = useState(false);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("Assigned");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const { user } = props;

  useEffect(() => {
    getData();
    getUsers();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/pickupRequests");
      let list = await response.data;
      list = list.sort((a, b) => new Date(b.addDate) - new Date(a.addDate));
      
      // Backend already provides areaName and dustbinName via enrichment
      // We just need to populate residentName
      list.forEach((request) => {
        request.residentName = "Loading...";
        // areaName and dustbinName are already provided by backend
      });
      
      setRequestList(list);
      filterRequests("Assigned", list);
    } catch (error) {
      showMessage("Error loading pickup requests");
    }
    setFlagLoad(false);
  }

  async function getUsers() {
    try {
      let response = await axios("/users");
      let list = await response.data;
      setUserList(list);
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  }

  // Populate display names after user data is loaded
  useEffect(() => {
    // Backend already provides areaName and dustbinName via enrichment
    // We only need to populate residentName from userList
    if (userList.length > 0) {
      populateDisplayNames();
    }
  }, [userList, requestList]);

  function populateDisplayNames() {
    const updatedList = requestList.map(request => {
      const updatedRequest = { ...request };
      
      // Get resident name from userList
      const resident = userList.find(u => u._id === request.userId || u._id === request.userId?.toString());
      updatedRequest.residentName = resident ? resident.name : "Unknown";
      
      // areaName and dustbinName are already provided by backend enrichment
      // No need to look them up here
      
      return updatedRequest;
    });
    
    filterRequests(filterStatus, updatedList);
  }

  async function handleStatusChange(request, newStatus) {
    setFlagLoad(true);
    try {
      let updateObj = {
        _id: request._id,
        status: newStatus
      };
      
      if (newStatus === "Collected") {
        updateObj.collectedAt = new Date().toISOString();
      }
      
      await axios.put("/pickupRequests", updateObj, {
        headers: { "Content-type": "multipart/form-data" }
      });
      
      showMessage("Status updated successfully");
      await getData();
      setSelectedRequest(null);
    } catch (error) {
      console.log(error);
      showMessage("Failed to update status");
    }
    setFlagLoad(false);
  }

  async function handlePhotoUpload(request) {
    if (!photoFile) {
      showMessage("Please select a photo first");
      return;
    }
    
    setFlagLoad(true);
    try {
      const formData = new FormData();
      formData.append('_id', request._id);
      formData.append('photoUrl', photoFile);
      formData.append('status', 'Collected');
      formData.append('collectedAt', new Date().toISOString());
      
      await axios.put("/pickupRequests", formData, {
        headers: { "Content-type": "multipart/form-data" }
      });
      
      showMessage("Photo uploaded and request marked as collected");
      await getData();
      setSelectedRequest(null);
      setPhotoFile(null);
    } catch (error) {
      console.log(error);
      showMessage("Failed to upload photo");
    }
    setFlagLoad(false);
  }

  function handleFilterStatus(status) {
    setFilterStatus(status);
    filterRequests(status, requestList);
  }

  function filterRequests(status, list = requestList) {
    let filtered = list;
    
    // Filter by status
    if (status === "Active") {
      filtered = filtered.filter(r => 
        r.status === "Assigned" || r.status === "InProgress"
      );
    } else if (status !== "All") {
      filtered = filtered.filter(r => r.status === status);
    }
    
    setFilteredList(filtered);
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
      <h3 className="mb-4">My Assigned Pickup Requests</h3>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      {/* Status Filters */}
      <div className="btn-group mb-3 w-100" role="group">
        <button 
          className={`btn ${filterStatus === 'Active' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleFilterStatus('Active')}
        >
          Active
        </button>
        <button 
          className={`btn ${filterStatus === 'Assigned' ? 'btn-info' : 'btn-outline-info'}`}
          onClick={() => handleFilterStatus('Assigned')}
        >
          Assigned
        </button>
        <button 
          className={`btn ${filterStatus === 'InProgress' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => handleFilterStatus('InProgress')}
        >
          In Progress
        </button>
        <button 
          className={`btn ${filterStatus === 'Collected' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => handleFilterStatus('Collected')}
        >
          Collected
        </button>
        <button 
          className={`btn ${filterStatus === 'All' ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => handleFilterStatus('All')}
        >
          All
        </button>
      </div>

      {/* Requests Cards */}
      {filteredList.length === 0 ? (
        <div className="text-center my-5">
          <p className="text-muted">No pickup requests assigned</p>
        </div>
      ) : (
        <div className="row">
          {filteredList.map((request) => (
            <div key={request._id} className="col-md-6 col-lg-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h6 className="card-title mb-0">{request.garbageType}</h6>
                    <span className={getStatusBadgeClass(request.status)}>
                      {request.status}
                    </span>
                  </div>
                  
                  <p className="card-text mb-2">
                    <strong>Resident:</strong> {request.residentName}
                  </p>
                  
                  <p className="card-text mb-2">
                    <strong>Area:</strong> {request.areaName}
                  </p>
                  
                  <p className="card-text mb-2">
                    <strong>Dustbin:</strong> {request.dustbinName}
                  </p>
                  
                  {request.address && (
                    <p className="card-text mb-2">
                      <i className="bi bi-geo-alt me-1"></i>
                      {request.address}
                    </p>
                  )}
                  
                  {request.notes && (
                    <p className="card-text small text-muted mb-2">
                      <i className="bi bi-sticky me-1"></i>
                      {request.notes}
                    </p>
                  )}
                  
                  <p className="card-text small text-muted mb-3">
                    <i className="bi bi-calendar me-1"></i>
                    {new Date(request.addDate).toLocaleDateString()}
                  </p>
                  
                  {request.status !== "Collected" && request.status !== "Cancelled" && (
                    <div className="d-grid gap-2">
                      {request.status === "Assigned" && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(request, "InProgress")}
                        >
                          Start Pickup
                        </button>
                      )}
                      {request.status === "InProgress" && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Complete & Upload Photo
                        </button>
                      )}
                    </div>
                  )}
                  
                  {request.collectedAt && (
                    <p className="card-text small text-success mb-0 mt-2">
                      <i className="bi bi-check-circle me-1"></i>
                      Collected: {new Date(request.collectedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Upload Modal */}
      {selectedRequest && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Complete Pickup</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setSelectedRequest(null);
                    setPhotoFile(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Request Details:</label>
                  <p className="mb-1"><strong>Resident:</strong> {selectedRequest.residentName}</p>
                  <p className="mb-1"><strong>Type:</strong> {selectedRequest.garbageType}</p>
                  <p className="mb-1"><strong>Address:</strong> {selectedRequest.address}</p>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Upload Collection Photo:</label>
                  <input 
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                  />
                  <small className="text-muted">
                    Upload a photo as proof of collection (optional)
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setSelectedRequest(null);
                    setPhotoFile(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => photoFile ? handlePhotoUpload(selectedRequest) : handleStatusChange(selectedRequest, "Collected")}
                >
                  Mark as Collected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
