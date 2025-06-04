import React, { useEffect } from "react";

const Playground: React.FC = () => {
  useEffect(() => {
    window.location.href = "https://play.flyde.dev";
  }, []);

  return null;
};

export default Playground;
