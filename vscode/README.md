<p align="center">
    <i>Visual AI Flows. In Your Codebase.</i> Open-source, runs in <strong>VS Code</strong>.<br/>Integrates with existing <strong>TypeScript</strong> code.
</p>


<div align="center">
    <img src="https://github.com/user-attachments/assets/97a5ce55-da02-4d76-bf4d-d0b1800f8c56"/>
</div>

<h5 align="center">
  
<strong>VSCode Extension ✔️</strong> · <strong>Runtime Library ✔️</strong> · <strong>Integrates with Existing Code ✔️</strong>
<br/>
<strong>Rich Standard Library ✔️</strong> · <strong>Visual Debugger ✔️</strong> · <strong>TypeScript Support ✔️</strong>
</h5>

## Why Flyde?

### 🔧 In-Codebase Integration
Runs directly in your codebase with access to runtime code and existing backend frameworks. Unlike standalone tools, Flyde is integrated as a library into your existing tools and CI/CD pipelines.

### 🤖 Visual Backend AI Workflows  
Prototype, integrate, evaluate and iterate on AI-heavy backend logic visually. Build backend AI agents, prompt chains, and agentic workflows with a visual interface while maintaining full code control.

### 🤝 Lower Collaboration Barrier
A visual extension of TypeScript that bridges the gap between developers and non-developers. Enable your entire team to contribute to backend AI workflow development.

## Introduction

`Flyde` is a holistic solution for prototyping, integrating, evaluating and iterating on AI-heavy backend logic. It's a visual extension of TypeScript that runs in-codebase, providing the missing link between developers and non-developers working on backend AI workflows. 

Flyde allows you to create visual flows for backend services like AI agents, prompt chains, API orchestration, and agentic workflows - directly integrated with your existing codebase. It includes a [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode) and seamlessly integrates with existing TypeScript/JavaScript code.

## Quick Start

`npx create-flyde-app`  
More info at [https://flyde.dev/quick-start](https://flyde.dev/quick-start)


## Who is Flyde for?

- **Product Teams & Developers:** Flyde bridges the gap between technical and non-technical team members. Product managers, designers, and backend developers can collaborate on the same visual flows, making complex backend logic transparent and enabling everyone to contribute meaningfully to the development process.

- **Developers Building AI-Powered Backends:** If you're dealing with complex prompt chains, AI agents, or multi-step backend AI workflows, Flyde provides a more manageable way to build, debug, and maintain these systems while keeping everything in your codebase.

- **Teams Seeking Visual Clarity:** Whether you're prototyping new backend features, managing complex business logic, API orchestration, or simply looking for a better way to document and understand your backend application flow, Flyde's visual approach helps you see the big picture while maintaining the power of code.

## Contributing

Flyde is an open-source project. We are committed to a fully transparent development process and highly appreciate any contributions. Whether you are helping us fix bugs, proposing new features, improving our documentation, or spreading the word - we would love to have you as a part of the Flyde community. Please refer to our [contribution guidelines](./CONTRIBUTING.md) and [code of conduct](./CODE_OF_CONDUCT.md).

- Bug Report: If you see an error message or encounter an issue while using Flyde, please create a [bug report](https://github.com/flydelabs/flyde/issues/new?assignees=&labels=type%3A+bug&template=bug.yaml&title=%F0%9F%90%9B+Bug+Report%3A+).

- Feature Request: If you have an idea or if there is a capability that is missing, please submit a [feature request](https://github.com/flydelabs/flyde/issues/new?assignees=&labels=type%3A+feature+request&template=feature.yml).

- Documentation Request: If you're reading the Flyde docs and feel like you're missing something, please submit a [documentation request](https://github.com/flydelabs/flyde/issues/new).

Not sure where to start? Join our [discord](https://www.flyde.dev/discord) and we will help you get started!

<a href="https://flyde.dev/discord">
    <img src="https://img.shields.io/badge/discord-7289da.svg?style=flat-square&logo=discord" alt="discord" style="height: 20px;">
  </a>

## Learn more

Check out the official website at [https://flyde.dev](https://flyde.dev) for more information.

## Telemetry

Flyde VS Code extension collects anonymous usage data to help improve the product. This includes events like extension activation, flow creation, and error reporting. No personal information or code content is collected. You can disable telemetry in VS Code settings (`flyde.telemetry.enabled`) or by setting the environment variable `FLYDE_TELEMETRY_DISABLED=true`.

## License

Everything needed to run a Flyde file is _MIT-licensed_. That includes:

- `@flyde/core`
- `@flyde/loader`
- `@flyde/nodes`

The UI library and other nodes of the toolkit are GNU AGPLv3 licensed.

In other words, using Flyde flows in your software is permitted without any limitation. However, if you use Flyde's visual editor in your own work, it must be open-sourced as well. More about [GNU APGLv3](https://choosealicense.com/licenses/agpl-3.0/) here
