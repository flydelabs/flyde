---
title: "Advanced Concepts"
description: "Deep dive into advanced Flyde concepts and patterns"
sidebar_position: 7
---

# Advanced Concepts

Flyde was built with flexibility and power in mind. To enable that, Flyde tries to be reactive and declarative.
This enables building custom flows and custom nodes with little overhead and boilerplate.

## Node Instance Input Modes

Each input of each instance of a node in a flow can be in one of the following modes:

### "Queued"

New values received by the input will be queued, and each time the node runs, it will consume the next value from the queue.

Queued inputs are great if you need to "buffer" values, or if you want to make sure that no values are lost.

### "Sticky"

The input will keep its last value throughout it's parent node/flow's lifecycle. Each new value received by the input will replace the previous value.

Sticky inputs are great for values that will act as "dynamic configuration" for the node.

## Node Lifecycle

A Node in Flyde can be in one of the following states:

### "Idle"

The node is not performing any work. It stays idle until all its required inputs are satisfied.

### "Running"

When a node starts running, it'll "consume" the values from its inputs and perform its work. This means that any queued inputs will be consumed, and any sticky inputs will be read.

While a node is running, new values will only take effect on the next time it runs, unless they are set as a "reactive input". More on that below.

A node can have implicit or explicit completion triggers. More on that below.

### 'Completed' and 'Error'

While not real "states", a node can be in a "completed" state or an "error" state. A node is considered "completed" when it has finished running and has no more work to do. A node is considered in an "error" state when it has thrown an error during its run. Both completed and error states are transient, and a node will go back to the "idle" state after it has completed or errored.

## Node Completion

### Implicit Completion

A node will implicitly complete when it has no more work to do. For code nodes, it means that their `run` method has returned. In case the `run` method returns a promise, the node will implicitly complete when the promise resolves.

For visual nodes, it means that all of its children have completed.

Implicit completion is the default behavior for nodes.

### Explicit Completion

A node can declare it has explicit completion by declaring a "completionOutputs" property. This property is an array of output names that will trigger the node to complete when they emit a value. It also supports a `+` operator to declare that all outputs should trigger completion.

For example:

- `completionOutputs: ['output1', 'output2']` will trigger the node to complete when either `output1` or `output2` emit a value.
- `completionOutputs: ['n1+n2']` will trigger the node to complete when both `n1` AND `n2` emitted a value.
- `completionOutputs: ['n1+n2', 'n3']` will trigger the node to complete when both `n1` AND `n2`, OR just 'm3' emitted a value.

Visual nodes' completion outputs can be declared explicitly as well by right-clicking the node and selecting "Set Completion Outputs".

## Reactive Inputs

A node can declare that an input is "reactive". This means that the node will re-run when the input emits a new value, even if the node is already running.

A great example of when this is useful is a "debounce" node. Imagine a "debounce" node with 2 inputs: `value` and `delay`. Once a value is received, the node needs to remain in "running" state for the duration of the delay, and then emit the value. But if a node only accepts new values when it is idle, it will not be able to accept the new value of `value` until it has completed.

To solve this, we can mark the `value` input as "reactive", and the node will re-run when the `value` input emits a new value. Updating the `delay` input will not trigger a re-run, as it is not marked as "reactive", and will only take effect on the next time the node runs.

## "Manually" Triggering a Node

By default, a node will run when all of its inputs are satisfied. But sometimes you might want to control when a node runs more granularly. To do so, you may expose a "Trigger" input, which will act as a manual trigger for the node. If this input is connected, the node will only run when it receives a value on the "Trigger" input (and all other inputs are satisfied).

To expose the "trigger" input, right-click the node instance and select the "Show Trigger" option.

_[ TODO: Add a gif showing how to expose the trigger input]_

## Error Handling

When a node throws an error, it will be in an "error" state. The error will be displayed in the node's UI, and the error will be propagated to the parent node/flow.

To "catch" an error and avoid it from propagating, you can expose the "Error" special output.
To expose the "Error" output, right-click the node instance and select the "Show output Error" option.

_[ TODO: Add a gif showing how to expose the trigger input]_
