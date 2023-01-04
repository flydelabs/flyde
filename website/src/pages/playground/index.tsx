import React, { useEffect, useState } from "react";

export default function Home(): JSX.Element {
  useEffect(() => {
    location.href = "hello-world";
  }, []);

  return <div>Loading</div>;
}
