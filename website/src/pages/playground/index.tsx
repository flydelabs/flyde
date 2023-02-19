import React, { useEffect, useState } from "react";

import HelloWorld from './hello-world';

export default function Home(): JSX.Element {
  useEffect(() => {
    history.pushState('/playground/hello-world', 'Hello World', '/playground/hello-world');
  }, []);

  return HelloWorld();
}
