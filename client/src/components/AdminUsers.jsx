import { useEffect, useState } from "react";
import CommonUtilityBar from "./CommonUtilityBar";
import LoadingSpinner from "./LoadingSpinner";
import axios from "./AxiosInstance";
import Modal from "./Modal";
import { getShowInList } from "../utils/commonUtil";

const selectedEntityDefault = {
  name: "Users",
  singularName: "User",
  dbCollection: "users",
  addFacility: true,
  deleteFacility: true,
  editFacility: true,
  accessLevel: "A",
};

const userSchema = [
  { attribute: "name", type: "normal" },
  { attribute: "emailId", type: "normal" },
  { attribute: "role", type: "normal" },
  { attribute: "activeStatus", type: "normal" },
];

function userIdString(u) {
  if (!u || u._id == null) return "";
  const id = u._id;
  if (typeof id === "object" && id.$oid) return id.$oid;
  return String(id);
}

function displayLoginId(u) {
  if (!u) return "—";
  return u.emailId || u.mobileNumber || "—";
}

function isUserActive(u) {
  if (typeof u.activeStatus === "boolean") return u.activeStatus;
  return u.status !== "disabled";
}

function roleLabel(r) {
  if (!r) return "—";
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function filterUserList(list, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((u) => {
    const idStr = displayLoginId(u);
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.emailId && u.emailId.toLowerCase().includes(q)) ||
      (u.mobileNumber && String(u.mobileNumber).toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (idStr && idStr.toLowerCase().includes(q))
    );
  });
}

export default function AdminUsers(props) {
  const selectedEntity = props.selectedEntity || selectedEntityDefault;
  const [userList, setUserList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showInList] = useState(getShowInList(userSchema, 4));

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [addForm, setAddForm] = useState({
    name: "",
    emailId: "",
    password: "",
    role: "resident",
  });

  const [editForm, setEditForm] = useState({
    _id: "",
    role: "resident",
    activeStatus: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setFilteredList(filterUserList(userList, searchText));
  }, [userList, searchText]);

  function showMessage(msg) {
    setMessage(msg);
    window.setTimeout(() => setMessage(""), 5000);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await axios.get("/users");
      const list = Array.isArray(res.data)
        ? [...res.data].sort(
            (a, b) => new Date(b.updateDate) - new Date(a.updateDate)
          )
        : [];
      setUserList(list);
    } catch {
      showMessage("Could not load users. Try again.");
    }
    setLoading(false);
  }

  function handleSearchInput(e) {
    setSearchText(e.target.value);
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!addForm.name || !addForm.emailId || !addForm.password) {
      showMessage("Name, email or mobile, and password are required.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/users", {
        name: addForm.name.trim(),
        emailId: addForm.emailId.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      showMessage("User created successfully.");
      setShowAddModal(false);
      setAddForm({
        name: "",
        emailId: "",
        password: "",
        role: "resident",
      });
      setSearchText("");
      await loadUsers();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Could not create user.";
      showMessage(errMsg);
    }
    setLoading(false);
  }

  function openEdit(user) {
    setEditForm({
      _id: userIdString(user),
      role: user.role || "resident",
      activeStatus: isUserActive(user),
    });
    setShowEditModal(true);
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put("/users", {
        _id: editForm._id,
        role: editForm.role,
        activeStatus: editForm.activeStatus,
      });
      showMessage("User updated.");
      setShowEditModal(false);
      await loadUsers();
    } catch {
      showMessage("Update failed.");
    }
    setLoading(false);
  }

  async function toggleActive(user) {
    const wasActive = isUserActive(user);
    setLoading(true);
    try {
      await axios.put("/users", {
        _id: userIdString(user),
        role: user.role,
        activeStatus: !wasActive,
      });
      showMessage("Status updated.");
      await loadUsers();
    } catch {
      showMessage("Could not update status.");
    }
    setLoading(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await axios.delete("/users/" + userIdString(deleteTarget));
      showMessage("User deleted.");
      setDeleteTarget(null);
      await loadUsers();
    } catch {
      showMessage("Delete failed.");
    }
    setLoading(false);
  }

  if (loading && userList.length === 0) {
    return (
      <div className="my-5 text-center">
        <LoadingSpinner size={50} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="mb-3">
        <h4 className="mb-0 text-primary">User management</h4>
        <p className="text-muted small mb-0">
          Create accounts, assign roles, and control access for admins, drivers,
          and residents.
        </p>
      </div>

      <CommonUtilityBar
        action="list"
        message={message}
        selectedEntity={selectedEntity}
        filteredList={filteredList}
        mainList={userList}
        showInList={showInList}
        searchText={searchText}
        onSearchChange={handleSearchInput}
        onListClick={() => {}}
        onAddEntityClick={() => setShowAddModal(true)}
        onSearchKeyUp={handleSearchInput}
        onExcelFileUploadClick={() => {}}
        onClearSelectedFile={() => {}}
        onFieldSelectorClick={() =>
          showMessage("Columns are fixed: Name, Email, Role, Status, Actions.")
        }
      />

      {loading && userList.length > 0 && (
        <div className="text-center py-2">
          <LoadingSpinner size={32} />
        </div>
      )}

      <div className="table-responsive shadow-sm rounded border">
        <table className="table table-hover table-striped mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email / Mobile</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-end">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-muted py-4">
                  {userList.length === 0
                    ? "No users yet. Add a user to get started."
                    : "No users match your search."}
                </td>
              </tr>
            )}
            {filteredList.map((u) => (
              <tr key={userIdString(u)}>
                <td>{u.name || "—"}</td>
                <td>{displayLoginId(u)}</td>
                <td>
                  <span className="badge bg-secondary-subtle text-dark border">
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td>
                  {isUserActive(u) ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-secondary">Inactive</span>
                  )}
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => openEdit(u)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-warning me-1"
                    onClick={() => toggleActive(u)}
                    disabled={loading}
                  >
                    {isUserActive(u) ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => setDeleteTarget(u)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => !loading && setShowAddModal(false)}
          />
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add user</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => !loading && setShowAddModal(false)}
                  />
                </div>
                <form onSubmit={handleAddSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name *</label>
                      <input
                        className="form-control"
                        value={addForm.name}
                        onChange={(e) =>
                          setAddForm({ ...addForm, name: e.target.value })
                        }
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email or mobile (login id) *</label>
                      <input
                        className="form-control"
                        value={addForm.emailId}
                        onChange={(e) =>
                          setAddForm({ ...addForm, emailId: e.target.value })
                        }
                        required
                        autoComplete="username"
                        placeholder="email@example.com or mobile number"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-control"
                        value={addForm.password}
                        onChange={(e) =>
                          setAddForm({ ...addForm, password: e.target.value })
                        }
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Role *</label>
                      <select
                        className="form-select"
                        value={addForm.role}
                        onChange={(e) =>
                          setAddForm({ ...addForm, role: e.target.value })
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="driver">Driver</option>
                        <option value="resident">Resident</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowAddModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      Create user
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {showEditModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => !loading && setShowEditModal(false)}
          />
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit user</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => !loading && setShowEditModal(false)}
                  />
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="driver">Driver</option>
                        <option value="resident">Resident</option>
                      </select>
                    </div>
                    <div className="mb-0 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="edit-active"
                        checked={editForm.activeStatus}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            activeStatus: e.target.checked,
                          })
                        }
                      />
                      <label className="form-check-label" htmlFor="edit-active">
                        Active (can sign in)
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowEditModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteTarget && (
        <Modal
          heading="Delete user"
          modalText={`Delete user "${deleteTarget.name || displayLoginId(deleteTarget)}"? This cannot be undone.`}
          btnGroup={["No", "Yes"]}
          onModalCloseClick={() => setDeleteTarget(null)}
          onModalButtonClick={(label) => {
            if (label === "Yes") confirmDelete();
            else setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
