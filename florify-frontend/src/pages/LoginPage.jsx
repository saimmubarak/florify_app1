import React, { useState } from "react";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import Button from "../components/Button";
import AnimatedText from "../components/AnimatedText";
import AnimatedImage from "../components/AnimatedImage";
import Popup from "../components/Popup";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await login({email, password});
      if (res.error) {
        setPopupMessage(res.error);
      } else {
        setPopupMessage("Login successful!");
        setTimeout(() => navigate("/landing"), 1000); // Redirect after short delay
      }
    } catch (err) {
      setPopupMessage("Login failed. Please try again.");
    }
  };

  return (
    <div className="container">
      {/* Left side */}
      <div className="left-side">
        <Logo src="/logo.png" />
        <div className="form">
          <AnimatedText text="Welcome Back" />

          <InputField
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button text="Log In" onClick={handleLogin} />

          <p style={{ marginTop: "1rem" }}>
            Don’t have an account?{" "}
            <a href="/signup" style={{ color: "#144345" }}>
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="right-side">
        <AnimatedImage src="/login-img.jpg" alt="Login Illustration" />
      </div>

      {/* Popup for errors/success */}
      <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
    </div>
  );
};

export default LoginPage;
