---
sidebar_position: 2
---

# Quick Start Guide
Welcome to Flyde! This quick start guide will help you get up and running with Flyde in no time.

Note: this guide is meant to cater to the impatient! Checking out the in-depth [hello world](/docs/Tutorials/hello-world-with-flyde) guide is highly recommended.

## Prerequisites
- VS Code with the [Flyde extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode) installed 
- Node.js and npm (comes with Node)

## Step 1: Create a new Flyde project
Open Visual Studio Code and create a new empty directory for your Flyde project.

## Step 2: Install the Flyde runtime
In the terminal, navigate to your project directory and run the following command:

`npm install @flyde/runtime`

This will install the Flyde runtime, which is needed to execute Flyde flows.

### Step 3: Create a new Flyde flow
1. In Visual Studio, open the command palette (cmd+k or ctrl+k)
2. type in `Flyde` and selected "Flyde: New Visual Flow"

## Step 4: Build your flow
Double click (or press `A`) to open Flyde's command palette.
Add some parts and connect them together by selecting inputs and outputs


## Step 5: Run your flow from code
To run your Flyde flow from code, you can use the loadFlow function from the Flyde runtime. This function takes the name of your Flyde flow file as an argument and returns a function that can be used to execute the flow.

Here's an example of how to use loadFlow:

```typescript
const { loadFlow } = require('@flyde/runtime');
const executeFlow = loadFlow('MyFlow.flyde');

executeFlow()
  .then(({ message }) => console.log(message))
```
You can also pass input values to your flow by passing an object to the executeFlow function. The object keys should match the input pin names of your flow.

```typescript
executeFlow({ input1: 'Hello', input2: 'World' })
  .then(({ output1, output2 }) => console.log(output1, output2))
```

That's it! You're now ready to start building powerful applications with Flyde. Happy ~coding~ building!
