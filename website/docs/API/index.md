# API

Flyde Quick Start Guide
Welcome to Flyde! This quick start guide will help you get up and running with Flyde in no time.

Prerequisites
Visual Studio Code with the Flyde extension installed
Node.js and npm (comes with Node)
Step 1: Create a new Flyde project
Open Visual Studio Code and create a new empty directory for your Flyde project.

Step 2: Install the Flyde runtime
In the terminal, navigate to your project directory and run the following command:

Copy code
npm install @flyde/runtime
This will install the Flyde runtime, which is needed to execute Flyde flows.

Step 3: Create a new Flyde flow
In Visual Studio Code, open the Flyde extension by clicking on the Flyde icon in the left sidebar.

Click on the "Create new flow" button to create a new Flyde flow.

Step 4: Build your flow
Use the Flyde extension to build your flow using the visual editor. You can add parts to the flow by dragging them from the parts panel onto the flow board. Connect the parts using connections by clicking and dragging from an output pin to an input pin.

Step 5: Run your flow from code
To run your Flyde flow from code, you can use the loadFlow function from the Flyde runtime. This function takes the name of your Flyde flow file as an argument and returns a function that can be used to execute the flow.

Here's an example of how to use loadFlow:

Copy code
const { loadFlow } = require('@flyde/runtime');
const executeFlow = loadFlow('MyFlow.flyde');

executeFlow()
  .then(({ message }) => console.log(message))
You can also pass input values to your flow by passing an object to the executeFlow function. The object keys should match the input pin names of your flow.

Copy code
executeFlow({ input1: 'Hello', input2: 'World' })
  .then(({ output1, output2 }) => console.log(output1, output2))
That's it! You're now ready to start building powerful applications with Flyde. Happy coding!