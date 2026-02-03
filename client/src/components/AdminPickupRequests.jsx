import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "./AxiosInstance";
import LoadingSpinner from "./LoadingSpinner";

export default function AdminPickupRequests(props) {
  const navigate = useNavigate();
  const [requestList, setRequestList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [driverList, setDriverList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [dustbinList, setDustbinList] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [flagLoad, setFlagLoad] = useState(false);
  const [message, setMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { user } = props;

  useEffect(() => {
    getData();
    getDrivers();
    getUsers();
    getDustbins();
    getAreas();
  }, []);

  async function getData() {
    setFlagLoad(true);
    try {
      let response = await axios("/pickupRequests");
      let list = await response.data;
      list = list.sort((a, b) => new Date(b.addDate) - new Date(a.addDate));
      
      // Populate display names
      list.forEach((request) => {
        request.residentName = "Loading...";
        request.driverName = "Not Assigned";
        request.dustbinName = "N/A";
        request.areaName = "N/A";
      });
      
      setRequestList(list);
      setFilteredList(list);
    } catch (error) {
      showMessage("Error loading pickup requests");
    }
    setFlagLoad(false);
  }

  async function getDrivers() {
    try {
      let response = await axios("/drivers");
      let list = await response.data;
      setDriverList(list);
    } catch (error) {
      console.log("Error fetching drivers:", error);
    }
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

  async function getDustbins() {
    try {
      let response = await axios("/dustbins");
      let list = await response.data;
      setDustbinList(list);
    } catch (error) {
      console.log("Error fetching dustbins:", error);
    }
  }

  async function getAreas() {
    try {
      let response = await axios("/areas");
      let list = await response.data;
      setAreaList(list);
    } catch (error) {
      console.log("Error fetching areas:", error);
    }
  }

  // Populate display names after all data is loaded
  useEffect(() => {
    if (userList.length > 0 || driverList.length > 0 || dustbinList.length > 0 || areaList.length > 0) {
      populateDisplayNames();
    }
  }, [userList, driverList, dustbinList, areaList, requestList]);

  function populateDisplayNames() {
    const updatedList = requestList.map(request => {
      const updatedRequest = { ...request };
      
      // Get resident name
      const resident = userList.find(u => u._id === request.userId);
      updatedRequest.residentName = resident ? resident.name : "Unknown";
      
      // Get driver name
      if (request.assignedDriverId) {
        const driver = driverList.find(d => d._id === request.assignedDriverId || d._id === request.assignedDriverId.toString());
        updatedRequest.driverName = driver ? driver.driverName : "N/A";
      } else {
        updatedRequest.driverName = "Not Assigned";
      }
      
      // Get dustbin name
      if (request.dustbinId) {
        const dustbin = dustbinList.find(d => d._id === request.dustbinId || d._id === request.dustbinId.toString());
        updatedRequest.dustbinName = dustbin ? dustbin.binName : "N/A";
      }
      
      // Get area name
      if (request.areaId) {
        const area = areaList.find(a => a._id === request.areaId || a._id === request.areaId.toString());
        updatedRequest.areaName = area ? area.areaName : "N/A";
      }
      
      return updatedRequest;
    });
    
    setFilteredList(updatedList);
  }

  async function handleAssignDriver(request, driverId) {
    setFlagLoad(true);
    try {
      let updateObj = {
        _id: request._id,
        assignedDriverId: driverId,
        status: driverId ? "Assigned" : "Pending"
      };
      
      await axios.put("/pickupRequests", updateObj, {
        headers: { "Content-type": "multipart/form-data" }
      });
      
      showMessage("Driver assigned successfully");
      await getData();
      setSelectedRequest(null);
    } catch (error) {
      console.log(error);
      showMessage("Failed to assign driver");
    }
    setFlagLoad(false);
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
    } catch (error) {
      console.log(error);
      showMessage("Failed to update status");
    }
    setFlagLoad(false);
  }

  async function handleDeleteRequest(request) {
    if (!window.confirm(`Delete pickup request from ${request.residentName}?`)) {
      return;
    }
    
    setFlagLoad(true);
    try {
      await axios.delete(`/pickupRequests/${request._id}`);
      showMessage("Request deleted successfully");
      await getData();
    } catch (error) {
      console.log(error);
      showMessage("Failed to delete request");
    }
    setFlagLoad(false);
  }

  function handleSearch(event) {
    const text = event.target.value;
    setSearchText(text);
    filterRequests(text, filterStatus);
  }

  function handleFilterStatus(status) {
    setFilterStatus(status);
    filterRequests(searchText, status);
  }

  function filterRequests(searchText, status) {
    let filtered = requestList;
    
    // Filter by status
    if (status !== "All") {
      filtered = filtered.filter(r => r.status === status);
    }
    
    // Filter by search text
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r => 
        (r.residentName && r.residentName.toLowerCase().includes(search)) ||
        (r.garbageType && r.garbageType.toLowerCase().includes(search)) ||
        (r.areaName && r.areaName.toLowerCase().includes(search)) ||
        (r.dustbinName && r.dustbinName.toLowerCase().includes(search))
      );
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
      <h3 className="mb-4">Pickup Requests Management</h3>

      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by resident, area, or garbage type..."
            value={searchText}
            onChange={handleSearch}
          />
        </div>
        <div className="col-md-6">
          <div className="btn-group w-100" role="group">
            <button 
              className={`btn ${filterStatus === 'All' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleFilterStatus('All')}
            >
              All
            </button>
            <button 
              className={`btn ${filterStatus === 'Pending' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => handleFilterStatus('Pending')}
            >
              Pending
            </button>
            <button 
              className={`btn ${filterStatus === 'Assigned' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => handleFilterStatus('Assigned')}
            >
              Assigned
            </button>
            <button 
              className={`btn ${filterStatus === 'Collected' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => handleFilterStatus('Collected')}
            >
              Collected
            </button>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Resident</th>
              <th>Area</th>
              <th>Dustbin</th>
              <th>Type</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted">
                  No pickup requests found
                </td>
              </tr>
            ) : (
              filteredList.map((request) => (
                <tr key={request._id}>
                  <td>{new Date(request.addDate).toLocaleDateString()}</td>
                  <td>{request.residentName}</td>
                  <td>{request.areaName}</td>
                  <td>{request.dustbinName}</td>
                  <td>{request.garbageType}</td>
                  <td>
                    <span className={getStatusBadgeClass(request.status)}>
                      {request.status}
                    </span>
                  </td>
                  <td>{request.driverName}</td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      {request.status !== "Collected" && request.status !== "Cancelled" && (
                        <button 
                          className="btn btn-outline-primary"
                          onClick={() => setSelectedRequest(request)}
                          title="Assign Driver"
                        >
                          <i className="bi bi-person-plus"></i>
                        </button>
                      )}
                      <button 
                        className="btn btn-outline-danger"
                        onClick={() => handleDeleteRequest(request)}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Driver Modal */}
      {selectedRequest && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Assign Driver</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedRequest(null)}
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
                  <label className="form-label">Select Driver:</label>
                  <select 
                    className="form-select"
                    onChange={(e) => handleAssignDriver(selectedRequest, e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Select driver...</option>
                    {driverList.filter(d => d.activeStatus).map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.driverName} - {driver.vehicleNumber}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Update Status:</label>
                  <select 
                    className="form-select"
                    onChange={(e) => handleStatusChange(selectedRequest, e.target.value)}
                    defaultValue={selectedRequest.status}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Assigned">Assigned</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Collected">Collected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
