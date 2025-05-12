import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

import girlLanai from "../assets/girl-lanai-transparent.png";
import ahupaa from "../assets/ahupuaa-transparent.png";
import moneySun from "../assets/money-sun-transparent.png";
import haeHawaii from "../assets/hae-hawaii.png";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password. Please try again.");
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
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
