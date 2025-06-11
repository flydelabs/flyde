---
title: "FAQ"
description: "Frequently asked questions about Flyde"
sidebar_position: 10
---

# Frequently Asked Questions

## What is the origin of the name "Flyde"?

"Flyde" means "flow" in Danish. Flow is a central concept in Flyde. And while we have no direct connection to Denmark, we appreciate the simplicity and functionality that Danish design often represents.

## Is Flyde "no-code"?

No. Flyde is a visual **programming** language, which means that it is a tool for creating software. While it may lower the barrier to entry for programming, just like assembly did to punch cards, and just like JavaScript did to C, it is still a programming language. If it has to be classified, it would be more accurate to call it a "low-code" tool, but even that is not a definition we're comfortable with.

## What about performance?

At the project's current stage, running a program using Flyde's runtime will be slower than running the same program written in TypeScript/JavaScript. The primary focus is on making the development experience as smooth as possible. We believe that the benefits of visual programming, such as increased readability and maintainability, will outweigh the performance cost for most use cases.

Moreover, once the project matures, many optimizations can be made to the runtime to improve performance. For example, we can compile the visual flow to a more efficient representation to avoid needing to interpret the flow at runtime. The runtime could be rewritten in a lower-level language, or even compiled to WebAssembly for better performance. These are all possibilities for the future.

## How Flyde relates to flow-based programming (FBP)?

Flyde is a visual programming language that is heavily inspired by flow-based programming (FBP). We came across J. Paul Morrison's (RIP) book "Flow-Based Programming" after we had already started working on Flyde, and we were thrilled to find that many of the concepts we had been developing were already well-established in the FBP community.

However, Flyde does not strictly adhere to the FBP paradigm. We have made some deviations from the traditional FBP model and do not see following FBP as a goal in itself. Instead, we aim to create a visual programming language that is practical and useful for modern software development.

## How does Flyde compare to other visual programming languages?

### NodeRED

Flyde integrates directly into TypeScript/JavaScript projects, acting as a visual layer within the code rather than an external service. It's designed to embed visual flows at any level of your application, from detailed business logic to overarching services, offering a seamless blend with existing codebases.

### Scratch

While Scratch is an excellent educational tool for beginners, Flyde is tailored for real developers. It adopts a functional, reactive approach and is designed to work within the ecosystems developers are already familiar with, like IDEs, without simplifying the complexity required for professional backend development.

### Enso

Enso targets data science with a unique IDE and programming language, focusing on data processing. In contrast, Flyde is application-centric, aiming to streamline backend development without introducing new tooling or languages, sticking closely to the existing TypeScript/JavaScript ecosystem.

### n8n / Zapier / Integromat / PipeDream

Unlike these automation platforms, which often work as closed systems for connecting APIs, Flyde is open-source and embeddable within your project. This gives developers the flexibility to craft detailed flows, from recursion to precise HTTP requests, offering a granular level of control and customization not typically available in no-code/low-code automation tools.
