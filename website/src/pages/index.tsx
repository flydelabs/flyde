import React, { useEffect } from "react";
import Typical from "react-typical";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";
import styles from "./index.module.css";
import YouTube from 'react-player/youtube'


import "../css/global.scss";
import { HeroExample } from "./_hero-example/HeroExample";


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
      <main className="home-page-main-content">
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
