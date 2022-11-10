---
sidebar_position: 1
---

# Hello World with Flyde

This tutorial will guide you step-by-step into creating an "Hello world" program using Flyde. For simplicity, we will use vanilla JS. For TS support check any of the official examples.


## What you'll need

- [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
- [VS Code](https://code.visualstudio.com/)
- [Flyde for VSCode](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)


## Create a new project

1. Navigate to projects favorite folder
1. `mkdir hello-flyde && cd hello-flyde` - create a new folder to host our future project
2. `npm init --yes` - initializes an empty npm project
3. `npm install @flyde/runtime && @flyde/stdlib` - install the runtime package (runs Flyde projects) and the Flyde stdlib
4. `code .` to open the project's folder using VSCode. If it's not working, check out [this article](https://code.visualstudio.com/docs/editor/command-line#_code-is-not-recognized-as-an-internal-or-external-command) or just open the folder you've created using VSCode

## Code-based sanity checkpoint

To ensure everything is installed properly, paste the following into a new file named `index.js`:
```
const {loadFlow} = require('@flyde/runtime');

console.log('Hello, world!');
```

Then run `node index.js` in the terminal and make sure you're seeing the "Hello, world!" message.

### Creating a visual Flyde flow





