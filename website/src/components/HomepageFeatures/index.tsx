import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    Svg: require("@site/static/img/undraw_vcs.svg").default,
    title: "Fully Integrable",
    description: (
      <>
        Flyde is a runtime library that integrates seamlessly with your existing
        code and workflows. It's easy to manage and version control your flows
        alongside your other code, making it simple to integrate Flyde into any
        project.{" "}
          With Flyde, you can leverage its powerful features and benefits
          without sacrificing <mark>your existing CI/CD, testing, and version control</mark> 
         {" "}systems
      </>
    ),
  },
  {
    Svg: require("@site/static/img/undraw_powerful.svg").default,
    title: "Build Complex Programs Faster and Easier",
    description: (
      <>
        Flyde's visual, flow-based approach and modular design make it easy for
        developers of all skill levels to build complex programs <mark>quickly and
        efficiently.</mark>{" "}
          Whether you're a novice developer looking to learn more, or an
          experienced developer looking for a powerful tool to streamline your
          workflow
        , Flyde can help you get more done, faster.
      </>
    ),
  },
  {
    title: "Visual Feedback and Debugging",
    Svg: require("@site/static/img/undraw_visionary_tech.svg").default,
    description: (
      <>
        Flyde's visual approach and <mark>real-time visual feedback</mark> make
        it easy to understand and debug programs. This can be especially helpful
        for novice developers, but can also be a valuable tool for experienced
        developers looking to optimize their workflow.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
