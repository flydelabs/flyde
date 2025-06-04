import React from "react";

interface FeatureDescription {
  id: string;
  preview: string;
  title: string;
  description: React.ReactNode;
  image: string;
  imageCaption: string;
}

export const features: FeatureDescription[] = [
  {
    preview: "Flexible & Powerful",
    title: "Flexible and Powerful",
    description: (
      <>
        <p>
          Built on a functional-reactive foundation, Flyde enables more than
          simple input/output flows. It supports everything you'd expect from a
          textual-based language; recursions, loops and conditionals.
        </p>
      </>
    ),
    image: require("@site/static/img/fibo.gif").default,
    imageCaption: "Fibonacci sequence in Flyde - a recursive flow example.",
    id: "flexible-powerful",
  },
  {
    preview: "Visual Editor",
    title: "Reason About Programs in New Ways",
    image: require("@site/static/img/visual.gif").default,
    imageCaption: "Visualize data flow and view data passing through nodes.",
    description: (
      <>
        <p>
          Unlock new ways to think about, and debug your programs. Have an
          always-correct diagram of your program.
        </p>

        <p>
          Flyde’s flow-based, visual approach makes asynchronous and concurrent
          tasks simpler and intuitive.
        </p>
      </>
    ),
    id: "visual-editor",
  },
  {
    preview: "Open Source",
    title: "Open Source and Transparent",
    description: (
      <>
        <p>
          In Flyde, nothing is hidden. From node implementation, to runtime
          code. Easily access the code behind each node in Flyde’s standard
          library.
        </p>
        <p>
          Everything needed to run Flyde flows is{" "}
          <strong>open-source and MIT licensed.</strong>
        </p>
      </>
    ),
    image: require("@site/static/img/transparent.gif").default,
    imageCaption: "Double click on nodes to jump to their implementation.",
    id: "open-source",
  },
  {
    preview: "Seamless Integration",
    title: "Integrates With Existing Workflows. Doesn’t Replace them.",
    description: (
      <>
        <p>
          Create Flyde flows right from your IDE. Wrap existing TypeScript code
          in a Flyde node and use it in your flows. Run flows from existing
          TypeScript code, from arbitrary CLI scripts, to HTTP request handlers,
          and even front-end code.
        </p>
        <p>
          Flows can be <strong>version-controlled</strong>, and be part{" "}
          <strong>CI/CD</strong> pipelines, just like regular text-based code.
        </p>
      </>
    ),
    image: require("@site/static/img/integrates.gif").default,
    imageCaption: "Flyde flows and TypeScript code live side by side.",
    id: "git-friendly",
  },
];
