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
    title: "Fully Integrable",
    Svg: require("@site/static/img/undraw_vcs.svg").default,
    description: (
      <>
        Flyde fully integrates into your{" "}
        <mark>existing codebase, version control system and CI/CD</mark>{" "}
        pipeline. Enjoy the benefits of visual programming without sacrificing
        modern engineering practices. Flyde flows are saved as files in your
        project's folder just like any other file. Using the runtime library, it
        integrates with your code. Write code-based components, write inline
        code snippets when necessary and even pass extra runtime context to your
        visual flow to achieve almost anything imaginable.
      </>
    ),
  },
  {
    title: "Easy and Fun To Use and Learn",
    Svg: require("@site/static/img/undraw_collab.svg").default,
    description: (
      <>
        For new programmers, Flyde provides another layer of abstraction that
        makes it <mark>much easier</mark> to build async and parallel flows
        without worrying about complex syntax. For experienced programmers,
        Flyde can help build high-level async heavy flows{" "}
        <mark>much faster</mark> then using only textual-coding.
      </>
    ),
  },
  {
    title: "Visual Feedback and Debugging",
    Svg: require("@site/static/img/undraw_visionary_tech.svg").default,
    description: (
      <>
        Flyde not only allows you to build flows visually, but also provides
        live visual feedback of the program running. Components light up as data
        pass through them. Runtime values can be inspected live.{" "}
        <mark>No more tedious console logging!</mark>
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
