import React from "react";
import { Routes, Route } from "react-router-dom";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/landing" element={<LandingPage />} />
    </Routes>
  );
};

export default App;
