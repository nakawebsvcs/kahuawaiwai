import React, { useState, useEffect } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "../firebase";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
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
  const [newUserRole, setNewUserRole] = useState("user");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [initializing, setInitializing] = useState(true); // New state for initialization phase

  // Fetch users using the Cloud Function
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Double-check that we have a current user
      if (!auth.currentUser) {
        throw new Error("No authenticated user found");
      }

      // Log the current user's ID token
      const token = await auth.currentUser.getIdToken();
      console.log(
        "Current user token (first 20 chars):",
        token.substring(0, 20)
      );

      // Get the user's claims to check admin status
      const decodedToken = await auth.currentUser.getIdTokenResult();
      console.log("User claims:", decodedToken.claims);

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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(
        "Auth state changed. Current user:",
        user ? user.email : "none"
      );

      if (user) {
        // User is signed in
        console.log("User authenticated in AdminPanel");

        try {
          // Force token refresh
          console.log("Forcing token refresh...");
          await user.getIdToken(true);
          console.log("Token refreshed successfully");

          // Add a short delay to ensure everything is synchronized
          setTimeout(() => {
            console.log("Attempting to fetch users after delay...");
            setLoading(true);
            fetchUsers();
            setInitializing(false);
          }, 1500); // 1.5 second delay
        } catch (error) {
          console.error("Error refreshing token:", error);
          setError("Authentication error: " + error.message);
          setInitializing(false);
          setLoading(false);
        }
      } else {
        // User is signed out
        console.log("User signed out or not authenticated in AdminPanel");
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        setInitializing(false);
        setError("Please sign in to view user data.");
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount

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


  // Invite a new user using the Cloud Function
 const inviteUser = async (e) => {
   e.preventDefault();
   setLoading(true);
   setError(null);
   setSuccess(null);

   try {
     // Force token refresh before making the call
     if (auth.currentUser) {
       await auth.currentUser.getIdToken(true);
     }

     console.log("Attempting to call inviteUser Cloud Function...");
     const inviteUserFunction = httpsCallable(functions, "inviteUser");
     const result = await inviteUserFunction({
       email: newUserEmail,
       role: newUserRole,
     });

     // Send password reset email to the newly created user
     if (result.data.success) {
       await sendPasswordResetEmail(auth, result.data.email);
       setSuccess(
         "User invited successfully! A set password email has been sent."
       );
       setNewUserEmail("");
       // Refetch users after successful creation
       fetchUsers();
     }
   } catch (error) {
     console.error("Error inviting user:", error);
     if (error.code === "functions/unauthenticated") {
       setError("Authentication failed to invite user. Please log in again.");
     } else if (error.code === "functions/permission-denied") {
       setError("Permission denied to invite user.");
     } else {
       setError("Failed to invite user: " + error.message);
     }
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
        // Force token refresh before making the call
        if (auth.currentUser) {
          await auth.currentUser.getIdToken(true);
        }

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
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Error signing out: " + error.message);
    }
  };

  return (
    <Container fluid className="admin-panel" style={{ paddingTop: "2rem" }}>
      {initializing ? (
        <div className="text-center p-4">
          <div
            className="spinner-border text-primary mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="mt-2">Initializing admin panel...</h5>
        </div>
      ) : (
        <>
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
                <Card.Header as="h5">Invite New User</Card.Header>
                <Card.Body>
                  <Form onSubmit={inviteUser}>
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
                      {loading ? "Inviting..." : "Invite User"}
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
                      {searchTerm
                        ? "No users match your search"
                        : "No users found"}
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
                                    user.role === "admin"
                                      ? "primary"
                                      : "secondary"
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
        </>
      )}
    </Container>
  );
}

export default AdminPanel;
