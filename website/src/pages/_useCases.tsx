import React from "react";
import Link from "@docusaurus/Link";

interface UseCaseDescription {
  title: string;
  content: React.ReactNode | string;
}

export const useCases: UseCaseDescription[] = [
  {
    title:
      "Simplify Programming For Novice Developers and Non-Developer Technical Roles",
    content: (
      <div>
        <p>
          Whether you're a junior developer struggling with async operations, a
          sales engineer needing to prototype with APIs quickly, or a QA
          engineer setting up backend tests, Flyde is your solution. By
          converting complex coding tasks into visual, intuitive flows, Flyde
          saves time and demystifies coding challenges.{" "}
        </p>
        <strong>
          Start now by exploring the{" "}
          <Link href="https://play.flyde.dev">Playground</Link>.
        </strong>
      </div>
    ),
  },
  {
    title:
      "Democratize Innovation by transforming your Codebase into a Low-Code Platform",
    content: (
      <div>
        <p>
          Open the door to broader team collaboration by integrating Flyde into
          your codebase. Product managers, data engineers, and other roles can
          now easily understand, contribute to, and innovate on your project,
          turning complex business logic into collaborative opportunities.
        </p>
        <strong>
          Learn how to integrate Flyde into existing code{" "}
          <Link href="https://www.flyde.dev/docs/integrate-flows/">here</Link>.
        </strong>
      </div>
    ),
  },
  {
    title: "A New Way for Educators to Teach Real-World Programming",
    content: (
      <div>
        <p>
          Flyde presents a unique blend of the functional and reactive
          programming paradigms, coupled with a visual interface. This positions
          Flyde as a uniquely valuable tool in the educator's arsenal,
          complementing more traditional, yet impactful, projects like Scratch
          and Blockly.{" "}
        </p>
        <strong>
          If you’re an educator looking to learn more, please reach out in on{" "}
          <Link href="/discord">Discord</Link>.
        </strong>
      </div>
    ),
  },
];
