import React, { useEffect } from "react";
import Typical from "react-typical";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";

import "../css/global.scss";


const UseCases = () => {
  return (
    <strong className="integration-points">
      <Typical
        steps={[
          "Discord Bots",
          1200,
          "Website Scrapers",
          1200,
          "Data Pipelines",
          1200,
          "APIs",
          1200,
          "CLI tools",
          1200,
          "Telegram Bots",
          1200,
          "Webhooks",
          1200,
          "The next big thing",
          5000
        ].map(s => typeof s === 'string' ? s + '.' : s)}
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
        <video loop muted autoPlay>
          <source src={"/background.mp4"} type="video/mp4" />
        </video>
        <video loop muted autoPlay>
          <source src={"/background.mp4"} type="video/mp4" />
        </video>
      </div>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">
          Flyde is <em>open source</em> visual, flow-based programming tool, batteries-included.
          <br />
          Seamlessly integrates with traditional coding using the <a
            href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
            target="_blank"
          >
            VSCode extension
          </a>.
          <br/>
          Build <UseCases/>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/playground"
          >
            Online Playground
          </Link>
          <Link
            className="button button--primary button--lg"
            to="/docs"
          >
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
