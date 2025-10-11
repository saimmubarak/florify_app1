import React from "react";

function LandingPage({ onLogout, userEmail }) {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Florify 🌸</h1>
      <p style={{ fontSize: "18px", color: "#555" }}>
        Logged in as <strong>{userEmail}</strong>
      </p>
      <button
        onClick={onLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Log Out
      </button>
    </div>
  );
}

export default LandingPage;
