<h1 align="center">
    <a href="https://www.flyde.dev" style="color: black">
    <img src="https://github.com/flydelabs/flyde/assets/3727015/eb1afa4a-0887-4cf2-99b5-35d4f1f6ee2a" height="40"/>
    </a>
</h1>

<p align="center">
    <i>Visual Programming. For Developers.</i> Open-source, runs in <strong>VS Code</strong>.<br/>Integrates with existing <strong>TypeScript</strong> code, browser and Node.js.
</p>

<h4 align="center">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/npm/l/@flyde/runtime" alt="license" style="height: 20px;">
  </a>
  <a href="https://github.com/flydelabs/flyde/blob/main/core/src/spec.ts">
    <img src="core/coverage-badge.svg" alt="coverage"/>
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

  <a href="https://twitter.com/FlydeLabs">
    <img src="https://img.shields.io/twitter/follow/FlydeLabs?style=social"/>
  </a>

  <a href="https://play.flyde.dev">
    <img src="https://img.shields.io/badge/Trigg:Managed Flyde-FEDD4E?style=flat&logo=world&logoColor=white"/>
  </a>

</h4>

<div align="center">
    <img src="https://github.com/flydelabs/flyde/assets/3727015/5d2d917b-48f6-49db-a1a9-e7fe685c408f"/>
</div>

<h5 align="center">
  
<strong>VSCode Extension ✔️</strong> · <strong>Runtime Library ✔️</strong> · <strong>Integrates with Existing Code ✔️</strong>
<br/>
<strong>Rich Standard Library ✔️</strong> · <strong>Visual Debugger ✔️</strong> · <strong>TypeScript Support ✔️</strong>
</h5>

## Introduction

`Flyde` is an open-source visual programming language built to integrate with your existing codebase. It allows you to create and run visual programs and is designed to complement and enhance traditional textual coding, not to replace it. It includes a [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode), seamlessly integrates with existing TypeScript/JavaScript code and runs on Node.js and in the browser.

## Quick Start

### Playground

The easiest way to experiment with Flyde is to visit the [online playground](https://flyde.dev/playground), which allows you to create and run flows in the browser.

### Running locally

1. Install the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
2. `mkdir my-flyde-project && cd my-flyde-project`
3. Open your project in VSCode
4. Command Palette (Ctrl+Shift+P) -> `Flyde: New visual flow`
5. Check out the [Integrating with Existing Code](https://www.flyde.dev/docs/integrate-flows) guide to learn how to integrate your flows with your code

## Who is Flyde for?

- **Novice Developers and Non-Technical Users:** Flyde simplifies programming by transforming complex code into accessible visual blocks, making it an ideal entry point for those new to development or from non-technical backgrounds.

- **Team Collaboration Across Roles:** Flyde democratizes innovation by enabling team members like product managers and data engineers to contribute directly to the codebase through visual programming, fostering collaboration and understanding.

- **Educators in Programming:** Flyde is a valuable resource for educators seeking to provide hands-on, interactive programming education by blending visual learning with real-world coding concepts.

- **Seasoned Developers:** Flyde offers experienced developers a new dimension of efficiency for designing, prototyping, and managing APIs and microservices visually, while retaining the flexibility and power of traditional coding. Its open-source nature and the commercial platform [Trigg.dev](https://www.trigg.dev?ref=readme) provide further customization and cloud-hosted capabilities.

And many more!

## Contributing

Flyde is an open-source project. We are committed to a fully transparent development process and highly appreciate any contributions. Whether you are helping us fix bugs, proposing new features, improving our documentation, or spreading the word - we would love to have you as a part of the Flyde community. Please refer to our [contribution guidelines](./CONTRIBUTING.md) and [code of conduct](./CODE_OF_CONDUCT.md).

- Bug Report: If you see an error message or encounter an issue while using Flyde, please create a [bug report](https://github.com/flydelabs/flyde/issues/new?assignees=&labels=type%3A+bug&template=bug.yaml&title=%F0%9F%90%9B+Bug+Report%3A+).

- Feature Request: If you have an idea or if there is a capability that is missing, please submit a [feature request](https://github.com/flydelabs/flyde/issues/new?assignees=&labels=type%3A+feature+request&template=feature.yml).

- Documentation Request: If you're reading the Flyde docs and feel like you're missing something, please submit a [documentation request](https://github.com/flydelabs/flyde/issues/new).

Not sure where to start? Join our discord and we will help you get started!

<a href="https://flyde.dev/discord">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="discord" style="height: 20px;">
  </a>

## Learn more

Check out the official website at [https://flyde.dev](https://flyde.dev) for more information.

## License

Everything needed to run a Flyde file is _MIT-licensed_. That includes:

- `@flyde/core`
- `@flyde/resolver`
- `@flyde/runtime`
- `@flyde/stdlib`

The UI library and other nodes of the toolkit are GNU AGPLv3 licensed.

In other words, using Flyde flows in your software is permitted without any limitation. However, if you use Flyde's visual editor in your own work, it must be open-sourced as well. More about [GNU APGLv3](https://choosealicense.com/licenses/agpl-3.0/) here
