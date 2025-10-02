import React from "react";

const InputField = ({ className = "", ...rest }) => {
  return <input className={className || "input"} {...rest} />;
};

export default InputField;
