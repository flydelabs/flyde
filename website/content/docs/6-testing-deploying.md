---
title: "Testing & Deploying"
description: "Best practices for testing and deploying Flyde flows"
sidebar_position: 6
---

# Testing, Deploying & Versioning

Although Flyde is a visual programming language, it's just a library. This means that **you can test, version control and deploy your flows using any tool you like.**

A great example is the standard library, which has some tests that use Flyde flows as fixtures. The flows are loaded and then tested like any other code. You can find them [here](https://github.com/flydelabs/flyde/blob/main/stdlib/src/Values/Values.spec.ts).

Same goes for deployment, you can use any deployment tool you like. You can use a CI/CD pipeline, a serverless framework, or even a simple bash script.

:::info
If you're looking for a way to deploy your flows as a service, check out [Flowcode](https://www.getflowcode.io?ref=flyde-docs). It is a fully hosted API and workflow builder based on Flyde.
:::
