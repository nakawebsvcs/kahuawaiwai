import React, { useState } from "react";
import topLeftImage from "../assets/IMG_1690.png";
import topRightImage from "../assets/IMG_1691.png";
import bottomLeftImage from "../assets/IMG_1692.png";
import bottomRightImage from "../assets/IMG_1693.png";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add authentication logic here
    onLogin();
  };

  return (
    <div className="login-container">
      <div className="top-images">
        <img src={topLeftImage} alt="Decorative" className="login-image" />
        <img src={topRightImage} alt="Decorative" className="login-image" />
      </div>
      <div className="loginForm">
        <form onSubmit={handleSubmit}>
          <h1>Welcome to Kahua Waiwai</h1>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit">Login</button>
        </form>
      </div>
      <div className="bottom-images">
        <img src={bottomLeftImage} alt="Decorative" className="login-image" />
        <img src={bottomRightImage} alt="Decorative" className="login-image" />
      </div>
    </div>
  );
}

export default Login;
