import React, { useEffect } from "react";
import Typical from "react-typical";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";
import YouTube from "react-player/youtube";

import "../css/global.scss";
import { HeroExample } from "./_hero-example/HeroExample";

const Gradient: React.FC = ({ children }) => (
  <span className="gradient">{children}</span>
);

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
        <h1 className="hero__title">
          <Gradient>Coding, Simplified:</Gradient> Visual Programming with Flyde
        </h1>
        <p className="hero__subtitle">
          Flyde, the <Gradient>AI-assisted</Gradient> visual programming tool
          for{" "}
          <a
            href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
            target="_blank"
          >
            VSCode.
          </a>
          <br />
          Simplifies the development of <Gradient>APIs, webhooks</Gradient>, and{" "}
          <Gradient>bots.</Gradient>
        </p>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={`Flyde | AI-Assisted Visual Programming Tool`}
      description="Flyde, the AI-assisted visual programming tool for VSCode.
      Simplifies the development of APIs, webhooks, and bots."
    >
      <HomepageHeader />
      <HeroExample />
      {/* <div className='video-container'>
          <YouTube
            url="https://www.youtube.com/watch?v=rFS7tm3_ptU"
            width='320px'
            height='195px'
            light={true}
            controls={true}
            config= {
              {
                playerVars: { autoplay: 1 }
              }
            }
          />
          </div> */}
      <main className="home-page-main-content" data-theme="dark">
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
