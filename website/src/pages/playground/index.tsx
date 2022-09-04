import React, { useEffect, useState } from "react";

export default function Home(): JSX.Element {
  useEffect(() => {
    location.href = location.href + "/hello";
  }, []);

  return <div>Loading</div>;
}
