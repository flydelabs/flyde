---
title: "Introducing Flyde"
date: "2023-05-15"
description: "An introduction to Flyde, a visual programming tool that helps developers build better software, faster."
author: "Gabriel Grinberg"
---

I'm thrilled to introduce the Alpha version of Flyde!  
Flyde is a visual programming tool that helps developers build better software, faster. While it was built with backend projects in mind, it can be used to build anything! From automation scripts to backends, front-ends, and even CLI tools!

![Hello World in Flyde](/images/blog/hello-world-final-result.gif)

## Why Visual?

Textual coding is great, and Flyde doesn't aim to replace that. On the contrary, Flyde is made to be fully integrable with existing code bases, elevating only high-level flows into the visual space.

However, I believe that a lot of modern backend code is what we call "glue code". Code that integrates several APIs, usually involving high concurrency. Such flows are easily conveyed in a whiteboard/design documents, taking advantage of our spatial abilities to the fullest.

By using a visual tool to build higher-level flows of applications, many benefits are unlocked:

- Collaboration with non-dev team members (such as product owners, QA, support, and more) becomes much easier. Reading a Flyde flow is much more intuitive than reading code. It's like Zapier and your Codebase had an awesome baby!
- Flows act as an always-correct flow chart, acting as living documentation for both new team members and existing ones
- Visual programming opens new ways of reasoning about code. For example, Flyde nodes light up as data passes through them, creating a new type of feedback loop while programming
- Monitoring and observability data can reside on top of the "code" itself, making troubleshooting much faster

## How Does It Work

Flyde's visual flow editor allows programs to be built by connecting nodes via a nodes-and-wires editor.  
It comes with:

- a _visual editor_ (VSCode extension and stand-alone)
- a runtime library and
- a robust standard library of ready-made components. Install or publish more Flyde components easily via the known and loved NPM ecosystem

Using the visual editor, you can build flows that use standard library nodes alongside your nodes (more on that below). After flows are created, execute them back from your code using Flyde's runtime library.

## Fully Integrated With Your Code

Flyde aims to **augment current workflows**, not replace them. Many other visual tools usually live outside of your existing codebase, excluding them from key aspects of modern software engineering such as version control and build/test pipelines (CI/CD).  
Flyde takes a different approach, and fully ingrates with existing code-bases and their flows:

- Flow files are committed to **your version control** system of choice like any other file. This means anything from revisions to branches and pull-requests work seamlessly with Flyde
- Flyde flows are executed from your existing codebase, making use of your **existing production environment**. No other platforms to manage or security risks to worry about
- Flyde flows can be tested using your **existing testing frameworks** and technologies, just like any node of your code. Nothing stops you from even writing test cases in Flyde that test your conventional code as well!

The integration to existing code is done in two ways:

1. Flyde nodes can be either visual nodes or code-based nodes. Code-based nodes support being imported from a local file in your project, meaning you can abstract any functionality in your code base into a Flyde node and use it in a visual flow.
2. Flyde flows run from your code. For example, if you build `my-cool-flow1.flyde`, you will need to call `execute('my-cool-flow')` from your code again, and choose what will you do with the response. Classic use cases are handling HTTP requests, building bots, and many more!

## Flow-Based Programming / Other tools

### Scratch / Blockly

[Scratch](https://scratch.mit.edu/) and [Blockly](https://developers.google.com/blockly) are both considered mostly educational platforms. They both belong to a more procedural and imperative style of programming.
Flyde takes a functional-reactive approach, embracing the style of modern applications. And while Flyde can be a great education tool, it is built with the full intent of becoming a production tool used by professional software teams.

### Node-RED

[Node-RED](https://noflojs.org/) is a great tool. It helped exposed many engineers to the benefits of visual programming tools.  
It has shown itself a great tool for building standalone home automation, and other IoT projects, but never became a tool developers use for more traditional and professional projects. Flyde is built to co-exist with current code bases, making it easier to cater to a wider audience of developers and projects.

### NoFlo

NoFlo is perhaps the most similar project to Flyde available. It started 10 years ago and I think its main reason for not becoming popular was that it was ahead of its time. One main difference is the fact that NoFlo is decoupled from its visual editor - [FlowHub](https://flowhub.io/) which came years later via a highly covered [Kickstarter campaign](https://www.kickstarter.com/projects/noflo/noflo-development-environment/posts/998057). I believe the decision to split the UI from the actual runtime comes from 2 reasons:

1. NoFlo is heavily inspired by [J. Paul Morrison's flow-based programming](https://www.youtube.com/watch?v=up2yhNTsaDs), which sees the value of looking at software as if it were nodes connected by wires even without a visual editor. While Flyde takes inspiration from the original FBP movement, it takes a more pragmatic and simple stance. The topic of Flow-Based Programming and Flyde deserves a blog post on its own, stay tuned :)
2. Building rich browser applications a decade ago was much harder than today. The lack of libraries available, problematic browser support, and an immature ecosystem made it hard to build a browser-based editor that users will love.

## Getting Started With Flyde

To get a feeling of how Flyde works, the best place to start is to visit the [Flyde Playground](/playground)!  
It has some simple examples that showcase the visual editor, and what building a Flyde flow looks like.

The next step is to the checkout the tutorials section of this site to learn how to integrate Flyde into real-world projects.

If you've read so far I'd appreciate showing support by [starring the project](https://www.github.com/flydelabs/flyde) and sending any feedback or comment via a GitHub issue or [Flyde's Discord channel](https://www.flyde.dev/discord)

Thanks and stay tuned for more blog posts!

Yours, Gabriel 