import React, { useEffect } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";
import clsx from "clsx";

import "../css/global.scss";
import { HeroExample } from "./_hero-example/HeroExample";

import Link from "@docusaurus/Link";
import { IconStar } from "../components/IconStar";

import exampleHelloWorld from "./_hero-example/ExampleHelloWorld.flyde";
import exampleDebounceThrottle from "./_hero-example/ExampleDebounceThrottle.flyde";
import exampleHttpRequests from "./_hero-example/ExampleHTTPRequests.flyde";
import exampleReactivity from "./_hero-example/ExampleReactivity.flyde";
import { features } from "./_features";

export const examples = [
  {
    label: "Beep Boop",
    flow: exampleReactivity,
    tip: `Try changing the collection count and see the output change accordingly.`,
    playgroundUrl: "https://play.flyde.dev/?flow=hello-world",
  },
  {
    label: "Hello World",
    flow: exampleHelloWorld,
    tip: `Try double clicking on the "World" node to change the string.`,
    playgroundUrl: "https://play.flyde.dev/?flow=hello-world",
  },
  {
    label: "Debounce/Throttle",
    flow: exampleDebounceThrottle,
    tip: "Try changing the delay time of the debounce/throttle nodes.",
    playgroundUrl: "https://play.flyde.dev/?flow=hello-world",
  },
  {
    label: "HTTP Requests",
    flow: exampleHttpRequests,
    tip: `Double click "Format Response" to see how it is implemented.`,
    playgroundUrl: "https://play.flyde.dev/?flow=hello-world",
  },
];

function HomepageHeader() {
  const [currentExample, setCurrExample] = React.useState(examples[1]);

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
            <Link
              className="button button--primary button--lg "
              href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
            >
              Quickstart
            </Link>
            <Link
              className="button button--secondary button--lg "
              to="https://play.flyde.dev"
            >
              Playground
            </Link>
            {/* <button
              className={`button button--success button${!didRun && " nudge"}`}
              onClick={onRunExample}
            >
              Run Example 👇
            </button> */}
          </div>
        </div>
        <div className="example-container">
          <HeroExample example={currentExample} key={currentExample.label} />
          {currentExample.tip ? (
            <div className="example-tip">
              Pssst.. {currentExample.tip} &nbsp;
              {/* <a href={currentExample.playgroundUrl} target="_blank">
              Open in playground
            </a> */}
            </div>
          ) : null}

          <div className="example-actions">
            {/* <span className="font-thin">Browse examples:</span> */}
            {examples.map((ex) => (
              <button
                key={ex.label}
                className={`button button--sm example-button ${
                  ex.label === currentExample.label
                    ? "button--primary"
                    : "button--secondary"
                }`}
                onClick={() => setCurrExample(ex)}
              >
                {ex.label}
              </button>
            ))}
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
      title={`Flyde`}
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
    </Layout>
  );
}
