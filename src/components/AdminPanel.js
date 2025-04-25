import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const functions = getFunctions();

  // Fetch users using the Cloud Function
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const getUsersFunction = httpsCallable(functions, "getUsers");
      const result = await getUsersFunction();
      setUsers(result.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create a new user using the Cloud Function
  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const createUserFunction = httpsCallable(functions, "createUser");
      await createUserFunction({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setSuccess("User created successfully!");
      setNewUserEmail("");
      setNewUserPassword("");
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setError("Failed to create user: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete a user using the Cloud Function
  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Are you sure you want to delete this user?`)) {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const deleteUserFunction = httpsCallable(functions, "deleteUser");
        await deleteUserFunction({ uid: userId });

        setSuccess("User deleted successfully");
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setError("Failed to delete user: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Redirect will be handled by your app's auth state listener
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Error signing out");
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel - User Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="user-actions">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="create-user-form">
        <h3>Create New User</h3>
        <form onSubmit={createUser}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label>Role:</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      <div className="user-list">
        <h3>Existing Users</h3>
        {loading && <p>Loading users...</p>}
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    onClick={() => handleDeleteUser(user.uid)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan="3">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminPanel;
