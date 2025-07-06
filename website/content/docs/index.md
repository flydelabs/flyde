---
title: "Introduction"
description: "Get started with Flyde, a visual, flow-based programming toolkit that integrates with your existing code"
sidebar_position: 1
---

# Introduction

Flyde is visual, flow-based, programming toolkit that **integrates with your existing code**. It allows you to create and run visual programs.

Flyde integrates with TypeScript (and JavaScript) on Node.js and frontend projects.

## Quick Start

### Playground

The easiest way to experiment with Flyde is to visit the [online playground](https://flyde.dev/playground), which allows you to create and run flows in the browser.

### Running locally

1. Install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
2. `mkdir my-flyde-project && cd my-flyde-project`
3. Open your project in VSCode
4. Command Palette (Ctrl+Shift+P) -> `Flyde: New visual flow`
5. Check out the [Integrating with Existing Code](./integrate-flows) guide to learn how to integrate your flows with your code

## Motivation

Modern development involves asynchronous and concurrency actions, which are more difficult to convey with text-based coding, and **easier, and more intuitive** to build, visualize and debug using a visual programming language.

Flyde was built **not to replace textual programming**, but augment it with a higher-level abstraction, **only when it makes sense to.**

Flyde makes it easier for **less skilled technical members to understand, and even contribute**, to business logic. It helps more seasoned developers by **having an always-correct diagram** of the program, as well as open new ways to troubleshoot functional and performance issues.

## Overview

Flyde's main building blocks are:

- .flyde files, which represent Flyde flows. They are YAML files behind the scenes and describe which nodes are in the flow, and how they are connected.
- The visual flow editor, which edits .flyde files. Available as a [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
- The runtime library, an npm package `@flyde/loader`, which runs loads and runs .flyde files. Both on NodeJS and the browser (via a webpack loader)
- The standard library, an npm package `@flyde/nodes`, which contains a set of built-in nodes that can be used to create flows. Note: `@flyde/loader` depends on `@flyde/nodes`, so you don't need to install it separately.

## Getting Started

If you want to learn how to integrate Flyde with your code, jump straight to the the [Integrating with Existing Code](./integrate-flows) guide.

The playground has many examples and showcases not only the visual editor, but also the runtime library, and how to integrate it with your own code.

After you've played with the playground, you can install the VSCode extension, and start creating your own flows and integrating them with your code.

Read more about Flyde's core concepts in the next article: [Core Concepts](./core-concepts).
