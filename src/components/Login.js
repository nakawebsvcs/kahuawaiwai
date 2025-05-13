import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import { auth } from "../firebase";
import girlLanai from "../assets/girl-lanai-transparent.png";
import ahupaa from "../assets/ahupuaa-transparent.png";
import moneySun from "../assets/money-sun-transparent.png";
import haeHawaii from "../assets/hae-hawaii.png";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Added missing success state
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault(); // Handle the event if provided

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Checking if email exists:", email);
    
    // First check if the email exists
    const methods = await fetchSignInMethodsForEmail(auth, email);
    console.log("Sign-in methods for email:", methods);
    
    // If the array is empty, no user exists with this email
    if (methods.length === 0) {
      console.log("No account found with this email");
      setError("No account found with this email address.");
      setLoading(false);
      return; // Important: return early to prevent further execution
    }
    
    // If we get here, the email exists, so send the reset email
    console.log("Email exists, sending password reset");
    await sendPasswordResetEmail(auth, email);
    setResetSent(true);
    setSuccess("Password reset email sent. Please check your inbox.");
  } catch (error) {
    console.error("Error in forgot password flow:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

      // Customize error messages for password reset
      switch (error.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email address.");
          break;
        case "auth/too-many-requests":
          setError("Too many requests. Please try again later.");
          break;
        default:
          setError("Failed to send reset email. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (error) {
      console.error("Login error:", error);

      // Customize error messages based on Firebase error codes
      switch (error.code) {
        case "auth/user-not-found":
          setError("No account found with this email address.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password. Please try again.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setError("This account has been disabled. Please contact support.");
          break;
        case "auth/too-many-requests":
          setError(
            "Too many unsuccessful login attempts. Please try again later or reset your password."
          );
          break;
        default:
          setError(
            "Login failed. Please check your credentials and try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Floating images */}
      {/* Floating images using img tags */}
      <img src={girlLanai} className="floating-image floating-image-1" alt="" />
      <img src={ahupaa} className="floating-image floating-image-2" alt="" />
      <img src={moneySun} className="floating-image floating-image-3" alt="" />
      <img src={haeHawaii} className="floating-image floating-image-4" alt="" />

      <div className="loginForm">
        <form onSubmit={handleSubmit}>
          <h1>Welcome to Kahua Waiwai</h1>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          <div
            className="login-actions"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", marginBottom: "15px" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleForgotPassword();
              }}
              className="forgot-password-link"
              style={{
                color: "#666", // Gray text
                textDecoration: "underline",
                background: "transparent",
                border: "none",
                padding: 0,
                display: "inline-block",
                cursor: "pointer",
                fontSize: "1rem", // Slightly larger font
                marginTop: "5px",
                textAlign: "center",
              }}
            >
              Forgot Password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
