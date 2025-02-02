import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head></Head>
      <body className="dark:bg-gray-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
