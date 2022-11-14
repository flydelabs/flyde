import React, { useEffect } from "react";
import Typical from "react-typical";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";

const IntegrationPoints = () => {
  return (
    <strong className="integration-points">
      <Typical
        steps={["IDE", 2000, "CI/CD", 2000, "Version Control", 2000, "Testing Setup", 2000]}
        loop={Infinity}
        wrapper="span"
      />
    </strong>
  );
};

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="videos-container">
        <video className="videoTag" loop muted autoPlay>
          <source src={"/background.mp4"} type="video/mp4" />
        </video>
      </div>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">
          Flyde is an <em>open source</em> flow-based, visual programming tool. JavaScript and
          TypeScript native support. Works in Node.js and browsers.
          <br />
          Fully integrates with your <IntegrationPoints />
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/playground">
            Online Playground
          </Link>
          <Link className="button button--primary button--lg" to="/docs/hello-world-with-flyde/">
            Get Started
          </Link>
          <span className={styles["gh-stars-wrapper"]}>
            <iframe
              className="gh-stars-frame"
              src="https://ghbtns.com/github-btn.html?user=flydehq&amp;repo=flyde&amp;type=star&amp;count=true&amp;size=large"
              width={160}
              height={30}
              title="GitHub Stars"
            />
          </span>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Visual Programming Tool`}
      description="Flyde is a modern visual programming tool that fully integrates with your codebase"
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
