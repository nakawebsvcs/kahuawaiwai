import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import girlLanai from "../assets/girl-lanai-transparent.png";
import ahupaa from "../assets/ahupuaa-transparent.png";
import moneySun from "../assets/money-sun-transparent.png";
import haeHawaii from "../assets/hae-hawaii.png";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Sending password reset email to:", email);

      // Send the reset email directly - Firebase handles email validation
      await sendPasswordResetEmail(auth, email);
      setSuccess(
        "If an account exists with this email, a password reset link has been sent. Please check your inbox."
      );
    } catch (error) {
      console.error("Error in forgot password flow:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      // Customize error messages for password reset
      switch (error.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
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

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Floating images */}
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

          {/* Password field with show/hide button */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
              width: "100%",
              gap: "5px", // Small gap between input and icon
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              style={{ width: "100%" }}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>

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
                color: "#666",
                textDecoration: "underline",
                background: "transparent",
                border: "none",
                padding: 0,
                display: "inline-block",
                cursor: "pointer",
                fontSize: "1rem",
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
