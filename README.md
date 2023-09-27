<div align="center">
<h1>Flyde: Visual Flow-Based Programming</h1>
</div>

<div align="center">
<a href="https://flyde.dev">Flyde</a> is a powerful visual flow-based programming toolkit that enables you to create and edit code using a visual flow-based programming interface. With Flyde, you can build backend flows quickly and intuitively, making it ideal for novice developers, non-developer technical teams, and experienced developers who want to prototype and test ideas fast.
<br/>

<br/>
  
[![Official Website](https://img.shields.io/badge/Official%20Website-flyde.dev-blue?style=flat&logo=world&logoColor=white)](https://flyde.dev.com)
[![Discord Follow](https://dcbadge.vercel.app/api/server/x7t4tjZQP8?style=flat)](https://discord.com/invite/x7t4tjZQP8)
[![GitHub Repo stars](https://img.shields.io/github/stars/flydelabs/flyde?style=social)](https://github.com/flydelabs/flyde)
[![@FlydeDev](https://img.shields.io/twitter/follow/FlydeDev?style=social)](https://twitter.com/FlydeDev)

<strong>VSCode Extension ✔️</strong> · <strong>Runtime Library ✔️</strong> · <strong>Integrates with Existing Code ✔️</strong>
<br/>
<strong>✔Rich Standard Library ✔️</strong> · <strong>Visual Debugger ✔️</strong> · <strong>AI-Assisted Node Creation ✔️</strong>
<br/>
<strong>TypeScript Support ✔️</strong> · <strong>TypeScript Support ✔️</strong>

<br/>
<br/>
</div>

![Flyde example](https://github.com/flydelabs/flyde-vscode/raw/main/media/walkthrough/run-flow.gif)

## Features

- Intuitive flow-based programming interface for creating and editing programs
- Real-time visual debugger for easy error handling and debugging
- Integrates with your existing codebase and workflows
- Supports TypeScript and JavaScript
- Build custom nodes visually, or use custom code
- Pre-built templates to help you get started quickly
- Split complex flows into sub-flows for better readability and maintainability
- A rich standard library of nodes for common tasks

## Getting Started

- Install the Flyde extension from the Visual Studio Code marketplace
- Right-click on a folder in the Explorer and select "Flyde: New Visual Flow"
- Choose a template and name your flow
- Start creating your flow by adding nodes, connecting them together, and writing code

## Use-cases

Flyde is versatile and can be used for a wide range of applications. Some example use cases include:

- Building an internal Slack bot
- Creating a simple web scraper
- Connecting several APIs together
- Building CLI tools

And many more!

## Learn More

Check out the official website at [https://flyde.dev](https://flyde.dev) for more information.

## License

Everything needed to run a Flyde file is _MIT_ licensed. That includes:

- `@flyde/core`
- `@flyde/resolver`
- `@flyde/runtime`
- `@flyde/stdlib`

The UI library and other nodes of the toolkit are GNU AGPLv3 licensed.

In other words, using Flyde flows in your software is permitted without any limitation. However, if you use Flyde's visual editor in your own work, it must be open-sourced as well. More about [GNU APGLv3](https://choosealicense.com/licenses/agpl-3.0/) here

## FAQ

### Is Flyde Production-Ready?

Flyde hasn't been extensively battle-tested beyond a few internal use cases. However, if interest and usage grow, there's no reason why Flyde should remain an experimental tool. If you're using Flyde for anything in production or with real traffic, please let me know!

### Does Flyde Replace Traditional Coding?

No. Textual coding excels in many areas, such as implementing algorithms, which would be challenging to create using Flyde. However, orchestrating multiple async APIs with transformation logic feels natural with Flyde. Flyde is designed to integrate with your existing code, not replace it.

### How is Flyde's Performance?

Flyde hasn't been optimized for runtime performance or benchmarked yet, so it should be slower than writing regular code. Just as JavaScript is slower than C, abstractions come at a cost. However, numerous ideas can improve performance, so it's safe to say performance will improve significantly in the future.

### Which Languages Are Supported?

Currently, only JavaScript and TypeScript are supported. However, since Flyde is a higher-level abstraction, there's no real logical barrier preventing support for other languages in the future.

### What Inspired You to Build Flyde?

Years of drawing and reviewing software designs on whiteboards led me to dream of a "run" button in the corner of the whiteboard. Modern development involves a lot of "glue" code, concurrency, asynchronicity, and third-party APIs. I find it hard to believe that developers will continue coding the same way in 10 years, and I think we're ready for the next level of abstraction. Flyde is my attempt to make that happen and lower the barrier for developers to create complex software, just as Assembly did for punched card programming, and C did for Assembly.

---

_"The world is asynchronous - don't try to force the systems we build into a synchronous framework!" - [J. Paul Morisson](https://www.jpaulmorrison.com/) RIP_
