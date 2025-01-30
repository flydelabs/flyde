import "@/styles/globals.css";

import type { AppProps } from "next/app";
import React from "react";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`main-container w-full h-screen`}>
      <Component {...pageProps} />
    </div>
  );
}
