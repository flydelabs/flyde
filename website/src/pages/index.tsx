import React, { useCallback, useEffect, useMemo, useState } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";
import clsx from "clsx";

import "../css/global.scss";
import { HeroExample } from "./_hero-example/HeroExample";

import Link from "@docusaurus/Link";
import { IconStar } from "../components/IconStar";
import { features } from "./_features";
import { examples } from "./_examples";
import { Button } from "@blueprintjs/core";
import { Play } from "@blueprintjs/icons";
import { useCases } from "./_useCases";

const FIRST_EXAMPLE_IDX = 0;

function HomepageHeader() {
  const [visibleTips, setVisibleTips] = useState(new Set());
  const [currentExample, setCurrExample] = React.useState(
    examples[FIRST_EXAMPLE_IDX]
  );

  const exampleRef = React.useRef(null);

  const runExample = useCallback(() => {
    exampleRef.current?.runFlow();
    setVisibleTips((tips) => new Set([...tips, currentExample.fileName]));
  }, [currentExample]);

  return (
    <div className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <div className="content-wrapper">
          <a
            className="github-star"
            href="https://www.github.com/flydelabs/flyde"
            target="_blank"
          >
            <IconStar /> <span>Star us on GitHub</span>
          </a>
          <h1 className="hero__title">
            <div className="font-thin">Visual Programming.</div>
            <div>For Developers</div>
          </h1>
          <p className="hero__subtitle">
            Open source, runs in{" "}
            <a
              href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
              target="_blank"
            >
              VS Code
            </a>
            , integrates with existing <strong>TypeScript</strong> code, browser
            and Node.js.
          </p>
          <div className="buttons-container">
            <Link className="button button--primary button--lg " href="/docs">
              Documentation
            </Link>
            <Link
              className="button button--secondary button--lg example-btn"
              href={currentExample.playgroundUrl}
            >
              Playground
            </Link>
          </div>
        </div>
        <div className="example-container">
          <HeroExample
            onChangeExample={(ex) => setCurrExample(ex)}
            example={currentExample}
            key={currentExample.label}
            ref={exampleRef}
          >
            <Button
              onClick={runExample}
              // large
              // intent=""
              className="run-flow-btn"
              icon={<Play />}
            >
              Run
            </Button>
          </HeroExample>

          <div
            className={clsx("example-tip", {
              hidden: !visibleTips.has(currentExample.fileName),
            })}
          >
            <strong>Challenge:</strong>&nbsp;
            {currentExample.tip.replace(/^[A-Z]/, (s) => s.toLowerCase())}{" "}
            &nbsp;
            <a
              href={currentExample.playgroundUrl}
              className="open- button button--sm button--secondary"
              target="_blank"
            >
              Open in Playground
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();

        let targetId = this.getAttribute("href");
        let targetElement = document.querySelector(targetId) as HTMLElement;

        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 100, // 100px offset
            behavior: "smooth",
          });
        }
      });
    });
  }, []);

  return (
    <Layout
      description="Flyde, open-source visual programming language.
      Runs in the IDE, integrates with existing TypeScript code, browser and Node.js."
    >
      <HomepageHeader />

      <section className="features-strip">
        {features.map((feature) => (
          <div className="feature-highlight" key={feature.title}>
            <a href={`#${feature.id}`}>{feature.preview}</a>
          </div>
        ))}
      </section>

      {features.map((feature) => (
        <section className="feature-strip" id={feature.id} key={feature.id}>
          <div className="feature-strip-inner">
            <div className="image-container">
              <img src={feature.image} />
              <div className="image-caption">{feature.imageCaption}</div>
            </div>
            <div className="content-container">
              <h3>{feature.title}</h3>
              <div className="feature-description">{feature.description}</div>
            </div>
          </div>
        </section>
      ))}

      <section className="use-cases">
        <h2>Use Cases</h2>
        {useCases.map((useCase) => (
          <div className="use-case" key={useCase.title}>
            <div className="use-case-inner">
              <h3>{useCase.title}</h3>
              <div className="use-case-description">{useCase.content}</div>
            </div>
          </div>
        ))}
      </section>
    </Layout>
  );
}
