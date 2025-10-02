// src/pages/SignupPage.jsx
import React, { useState } from "react";
//import "./SignupPage.css";
import Logo from "../components/Logo";
import InputField from "../components/InputField";
import Button from "../components/Button";
import AnimatedText from "../components/AnimatedText";
import AnimatedImage from "../components/AnimatedImage";
import Popup from "../components/Popup";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  const handleSignup = (e) => {
    e?.preventDefault?.();
    setPopupMessage("Signup functionality not wired in this snippet.");
    setTimeout(() => setPopupMessage(""), 2000);
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="left-side">
          <div className="logo-float">
            <Logo src="/logo.png" size={56} />
          </div>

          <div className="form" role="form" aria-label="Signup form">
            <h1 className="animated-heading">
              <AnimatedText text="Create your account" />
            </h1>
            <p className="lead">Join us — clean, modern signup.</p>

            <form onSubmit={handleSignup}>
              <div className="field">
                <label className="field-label">Name</label>
                <InputField
                  className="input"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Email</label>
                <InputField
                  className="input"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <InputField
                  className="input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="button-row">
                <Button text="Sign Up" onClick={handleSignup} />
              </div>
            </form>

            <p className="small-note">
              Already have an account? <a href="/login">Log in</a>
            </p>
          </div>
        </div>

        <div className="right-side">
          <AnimatedImage src="/signup-img.jpg" alt="Signup Illustration" />
        </div>
      </div>

      <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
    </div>
  );
};

export default SignupPage;
