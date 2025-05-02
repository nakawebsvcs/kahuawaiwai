import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  InputGroup,
} from "react-bootstrap";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [authReady, setAuthReady] = useState(false); // Track if the auth state is ready
  const functions = getFunctions();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthReady(true); // Set authReady to true when the user is authenticated
        console.log("User is authenticated:", user.email);
      } else {
        setAuthReady(false);
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, []);

  // Ensure authentication is ready before making function calls
  const ensureAuthenticated = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.getIdToken(true); // Force token refresh to ensure we have a fresh token
        console.log("Authentication confirmed for user:", user.email);
        return true;
      } catch (error) {
        console.error("Error refreshing token:", error);
        throw new Error("Authentication error");
      }
    } else {
      throw new Error("User not authenticated");
    }
  };

  // Fetch users using the Cloud Function
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(true); // Ensure the ID token is fresh

        const getUsersFunction = httpsCallable(functions, "getUsers");
        const result = await getUsersFunction({ idToken }); // Pass the ID token to the function
        const fetchedUsers = result.data.users || [];
        setUsers(fetchedUsers);
        setFilteredUsers(fetchedUsers);
      } else {
        throw new Error("User not authenticated");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait until auth is ready before fetching users
    if (authReady) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [authReady]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(lowercaseSearch) ||
          user.role.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Create a new user using the Cloud Function
  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(true); // Ensure the ID token is fresh

        const createUserFunction = httpsCallable(functions, "createUser");
        await createUserFunction({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          idToken, // Pass the ID token to the function
        });

        setSuccess("User created successfully!");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        throw new Error("User not authenticated");
      }
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
        if (authReady) {
          await ensureAuthenticated();

          const deleteUserFunction = httpsCallable(functions, "deleteUser");
          await deleteUserFunction({ uid: userId });

          setSuccess("User deleted successfully");
          fetchUsers();
        } else {
          throw new Error("User not authenticated");
        }
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
    <Container fluid className="admin-panel">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>User Management</h2>
            <Button
              variant="outline-secondary"
              onClick={handleLogout}
              className="logout-btn"
            >
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </Button>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={4} lg={3}>
          <Card className="mb-4">
            <Card.Header as="h5">Create New User</Card.Header>
            <Card.Body>
              <Form onSubmit={createUser}>
                <Form.Group className="mb-3">
                  <Form.Label>Email:</Form.Label>
                  <Form.Control
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password:</Form.Label>
                  <Form.Control
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Role:</Form.Label>
                  <Form.Select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Form.Select>
                </Form.Group>
                <Button
                  type="submit"
                  variant="success"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create User"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">User List</h5>
                <InputGroup style={{ width: "300px" }}>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </InputGroup>
              </div>
            </Card.Header>
            <Card.Body>
              {loading && <p>Loading users...</p>}
              {!loading && filteredUsers.length === 0 && (
                <Alert variant="info">
                  {searchTerm ? "No users match your search" : "No users found"}
                </Alert>
              )}
              {filteredUsers.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.uid}>
                          <td>{user.email}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                user.role === "admin" ? "primary" : "secondary"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteUser(user.uid)}
                            >
                              <i className="bi bi-trash"></i> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminPanel;