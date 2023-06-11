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
    Svg: require("@site/static/img/undraw_visionary_tech.svg").default,
    title: "Simplified Coding",
    description: (
      <>
        Flyde's visual interface brings simplicity to coding. Beginners can
        build complex systems without diving deep into complex syntax or
        <mark>asynchronous and concurrent</mark> programming. It's a
        user-friendly way to code, focusing on the big picture, not the small
        details.
      </>
    ),
  },
  {
    Svg: require("@site/static/img/undraw_ai.svg").default,
    title: "AI-Assisted",
    description: (
      <>
        Flyde integrates with AI to enable users to turn free text into code
        components. Let AI take care of the inner workings,{" "}
        <mark>while controlling the bigger picture!</mark>
      </>
    ),
  },
  {
    title: "Seamless Integration",
    Svg: require("@site/static/img/undraw_vcs.svg").default,
    description: (
      <>
        Built to support modern practices, it works seamlessly with{" "}
        <mark>CI/CD pipelines, testing frameworks, and version control,</mark>{" "}
        enhancing your development process without disrupting established
        methodologies.
      </>
    ),
  },
  {
    title: "Open-Source",
    Svg: require("@site/static/img/undraw_os.svg").default,
    description: (
      <>
        Flyde is an open-source tool, welcoming contributions from developers
        globally. This fosters continuous updates, fresh ideas, and relevant
        tools. This spirit of collaboration ensures Flyde{" "}
        <mark>constantly evolves to meet developers' needs.</mark>
      </>
    ),
  },
  {
    title: "Visual Debugger",
    Svg: require("@site/static/img/undraw_visual.svg").default,
    description: (
      <>
        Flyde's visual debugger provides real-time feedback, making it easier to
        understand, track, and fix issues in your software. It highlights active
        parts and <mark>visually indicates the flow of data,</mark> enabling
        both beginners and experienced developers to quickly identify and
        resolve problems in their systems.
      </>
    ),
  },
  {
    title: "Pre-built Components",
    Svg: require("@site/static/img/undraw_features.svg").default,
    description: (
      <>
        Jumpstart your development with Flyde's extensive library of pre-built
        components. Whether you need to interact with the file system, make HTTP
        requests, manipulate lists, or handle string operations, Flyde has you
        covered. These components not only save you time but also help you avoid
        common coding pitfalls, letting you focus on building your application.
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
