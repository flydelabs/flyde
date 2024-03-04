<h1 align="center">
    <a href="https://www.flyde.dev" style="color: black">
    <img src="https://github.com/flydelabs/flyde/assets/3727015/eb1afa4a-0887-4cf2-99b5-35d4f1f6ee2a" height="40"/>
    </a>
</h1>


<p align="center">
    Visual Programming. For Developers. <br/>
Open source, runs in <strong>VS Code</strong>, integrates with existing <strong>TypeScript</strong> code, browser and Node.js.
</p>

<h4 align="center">
<a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/npm/l/@flyde/runtime" alt="license" style="height: 20px;">
  </a>
  

  <a href="https://www.flyde.dev">
    <img src="https://img.shields.io/badge/Website-007ec6?style=flat&logo=world&logoColor=white"/>
  </a>

  
  <a href="https://play.flyde.dev">
    <img src="https://img.shields.io/badge/Playground-007ec6?style=flat&logo=world&logoColor=white"/>
  </a>
  <br>
  <a href="https://flyde.dev/discord">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="discord" style="height: 20px;">
  </a>

  <a href="https://twitter.com/FlydeDev">
    <img src="https://img.shields.io/twitter/follow/FlydeDev?style=social"/>
  </a>

</h4>


![Flyde example](https://github.com/flydelabs/flyde-vscode/raw/main/media/walkthrough/run-flow.gif)


<h5 align="center">
  
<strong>VSCode Extension ✔️</strong> · <strong>Runtime Library ✔️</strong> · <strong>Integrates with Existing Code ✔️</strong>
<br/>
<strong>Rich Standard Library ✔️</strong> · <strong>Visual Debugger ✔️</strong> · <strong>AI-Assisted Node Creation ✔️</strong>
<br/>
<strong>TypeScript Support ✔️</strong> · <strong>TypeScript Support ✔️</strong>
</h5>


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

Everything needed to run a Flyde file is _MIT-licensed_. That includes:

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
