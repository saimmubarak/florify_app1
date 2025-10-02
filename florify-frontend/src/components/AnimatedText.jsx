import React from "react";
import Typewriter from "typewriter-effect";

const AnimatedText = ({ text }) => (
  <Typewriter
    options={{
      strings: [text],
      autoStart: true,
      loop: false,
      delay: 30,
    }}
  />
);

export default AnimatedText;
