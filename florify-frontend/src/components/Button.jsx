import React from "react";
import "./Button.css"; // ensure it contains .custom-btn styles provided earlier

const Button = ({ text, onClick, type = "button" }) => {
  return (
    <button type={type} className="custom-btn" onClick={onClick}>
      <span>{text}</span>
    </button>
  );
};

export default Button;
