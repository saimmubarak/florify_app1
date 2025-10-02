import React from "react";
import "./Logo.css";

const Logo = ({ src = "/logo.png", size = 56, alt = "logo" }) => {
  return (
    <div>
      <img src={src} alt={alt} style={{ width: size, height: size }} />
    </div>
  );
};

export default Logo;
