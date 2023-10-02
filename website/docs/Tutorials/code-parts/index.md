---
sidebar_position: 2
---

# [ WIP ] Creating Custom Code Nodes with Flyde

In this tutorial, we'll guide you step-by-step through creating a custom code node using Flyde.  
We'll wrap the `validator` npm package into a Flyde code node that validates email addresses, and use it in a visual flow by running it with the Flyde extension.

## Prerequisites

- Visual Studio Code installed.
- [Flyde](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode) extension installed in Visual Studio Code.

## Step 1: Set up a new project

Create a new directory for your project and open it in Visual Studio Code. Initialize a new npm project by running `npm init -y` in the terminal.

## Step 2: Install the needed packages

1. Install the `validator` package by running `npm install validator` in the terminal. This package will be used to validate the email address.
2. Install the `@flyde/core` package by running `npm install @flyde/core` in the terminal (for the code node interface).

## Step 3: Create a new Flyde flow

1. Right click on the VSCode's sidebar -> "Flyde: New Visual Flow"
2. Name your flow "Validator Example" and choose the "Blank" template
3. You should now see a Flyde flow editor tab inside your IDE

[ Screenshot of the Flyde panel with a new flow ]

## Step 4: Create a custom code node

Create a new file, call it "EmailValidator.flyde.ts" and add the following code:

```
import { CodeNode } from '@flyde/core';

export const validatorNode: CodeNode = {
  id: 'Email Validator',
  description: 'Validates an email address',
  inputs: {
    email: {
      description: 'Email address to validate',
    },
  },
  outputs: {
    isValid: {
      description: 'Whether the email is valid',
    },
  },
  fn: async (inputs, outputs) => {
    // logic will go here
  },
};
```

_Important_: Flyde will auto-detect valid code nodes by searching for "_.flyde.ts" or "_.flyde.js" files in your project, so make sure to name your file accordingly.

[ Screenshot of the custom code node file ]

## Step 5: Add the validator package to the custom code node

1. In the generated code node file (EmailValidator.flyde.ts), import the validator package by adding the following line at the top:
   `import validator from 'validator';`
2. Change the implementation of the fn function to the following:

```
fn: (inputs, outputs) => {
  const isValid = validator.isEmail(inputs.email);
  outputs.isValid.next(isValid);
},
```

Flyde will make all inputs available as properties on the inputs object, and all outputs available as properties on the outputs object. The next function on the output will emit the value to the next node in the flow.

[ Screenshot of the custom code node file with the changes ]

## Step 6: Add the custom code node to the flow

1. Open the flow you've created earlier.
2. Open the "add node" menu by clicking on the "+" button in the right actions menu of the flow editor.
3. Search for "Email Validator" and click on the "Add" button.

[ Screenshot of the flow editor with the custom code node added ]

## Step 7: Create the email validation flow

1. Add a main input to the flow by right-clicking the flow editor, and choosing "New input"
2. Name the input "value"
3. Connect that main input to the "Email Validator" node

[ Screenshot of the completed flow with all nodes connected ]

## Step 8: Run the flow

1. Click on the "Run flow" button in the actions menu.
2. Enter a test email address in the "value" input node and click "Run".
3. Hover over the "isValid" output node to see the result. You can also see it in the VSCode "Flyde" output channel.

[ Gif of the flow running with the test email address ]

That's it! You've successfully created a custom code node using the validator npm package and used it in a Flyde flow. Experiment with other npm packages and build more complex flows using Flyde's visual flow-based programming interface.

## Next steps

Before moving on to the next tutorial, I highly recommend you to try tinkering with this example:

- allow passing a second, optional parameter to the code node to specify the validation options that the validator package supports.
- explore the "defaultStyle" property of the CodeNode interface and try making your node pop-out.
- Try adding a list of email addresses, a loop node and a delay and see how you can validate a list of email addresses.
- package that node into a separate npm package and publish it to npm! See [/packages] for more info.

---

If you have any feedback or issue please open a [Github issue](https://github.com/flydelabs/flyde/issues/new) or ping us on Discord.
