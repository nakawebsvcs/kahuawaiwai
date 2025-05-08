import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { functions, auth } from "../firebase";
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
  const [loading, setLoading] = useState(true); // Start loading state as will fetch on auth state change
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Removed authReady state

  // Removed ensureAuthenticated function - rely on httpsCallable

  // Fetch users using the Cloud Function
const fetchUsers = async () => {
  setLoading(true);
  setError(null);

  try {
    // Force token refresh before making the call
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true); // true forces refresh
    } else {
      throw new Error("No authenticated user found");
    }

    const getUsersFunction = httpsCallable(functions, "getUsers");
    console.log("Attempting to call getUsers Cloud Function...");
    const result = await getUsersFunction();
    console.log("Function result:", result);
    const fetchedUsers = result.data.users || [];
    setUsers(fetchedUsers);
    setFilteredUsers(fetchedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    if (error.code === "functions/unauthenticated") {
      setError("Authentication failed. Please log in again.");
    } else {
      setError("Failed to load users: " + error.message);
    }
  } finally {
    setLoading(false);
  }
};

  // Primary useEffect to handle auth state changes and initial fetch
  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(
        "Auth state changed. Current user:",
        user ? user.email : "none"
      );
      if (user) {
        // User is signed in. Now it's safe to attempt fetching data.
        // The httpsCallable should now have access to the user's token.
        console.log("User authenticated, attempting initial fetch...");
        setLoading(true); // Indicate loading while fetching
        fetchUsers();
      } else {
        // User is signed out. Clear user data and stop loading.
        console.log("User signed out.");
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        setError("Please sign in to view user data.");
        // Optional: Redirect to login page
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Filter users based on search term - this effect looks good
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
    setLoading(true); // Can have separate loading states if needed, but general loading is fine for now
    setError(null);
    setSuccess(null);

    // httpsCallable handles authentication implicitly.
    // If the user isn't authenticated, the function will fail server-side with 'unauthenticated'.
    // The error handling below will catch it.
    try {
      console.log("Attempting to call createUser Cloud Function...");
      const createUserFunction = httpsCallable(functions, "createUser");
      await createUserFunction({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });

      setSuccess("User created successfully!");
      setNewUserEmail("");
      setNewUserPassword("");
      // Refetch users after successful creation
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.code === "functions/unauthenticated") {
        setError("Authentication failed to create user. Please log in again.");
        // Optional: Redirect to login page or trigger logout
        // handleLogout();
      } else if (error.code === "functions/permission-denied") {
        setError("Permission denied to create user.");
      } else {
        setError("Failed to create user: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete a user using the Cloud Function
  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Are you sure you want to delete this user?`)) {
      setLoading(true); // Can have separate loading states if needed
      setError(null);
      setSuccess(null);

      // httpsCallable handles authentication implicitly.
      // If the user isn't authenticated, the function will fail server-side with 'unauthenticated'.
      // The error handling below will catch it.
      try {
        console.log(
          `Attempting to call deleteUser Cloud Function for UID: ${userId}`
        );
        const deleteUserFunction = httpsCallable(functions, "deleteUser");
        await deleteUserFunction({ uid: userId });

        setSuccess("User deleted successfully");
        // Refetch users after successful deletion
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        if (error.code === "functions/unauthenticated") {
          setError(
            "Authentication failed to delete user. Please log in again."
          );
          // Optional: Redirect to login page or trigger logout
          // handleLogout();
        } else if (error.code === "functions/permission-denied") {
          setError("Permission denied to delete user.");
        } else {
          setError("Failed to delete user: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Signing out...");
      await signOut(auth);
      console.log("Sign out successful.");
      // The component rendering based on auth state will likely handle
      // redirecting the user after sign out is complete.
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Error signing out: " + error.message); // Add error message detail
    }
  };

  return (
    <Container fluid className="admin-panel" style={{ paddingTop: "2rem" }}>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mt-2">User Management</h2>
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
