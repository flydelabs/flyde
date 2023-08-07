---
sidebar_position: 5
---

# Lifecycle of a Node

A node in Flyde is a self-contained unit of functionality that can be connected to other nodes to form a flow. The lifecycle of a node consists of two states: waiting for inputs, and processing.

When a node is waiting for inputs, it is waiting for data to be passed to it through its input pins. Once all required input pins have received data, the node will start processing.

By default, input pins are "sticky", meaning that each new input will replace the previous one. However, input pins can also be configured to queue up different values in a first-in-first-out (FIFO) manner.

A code node's processing is determined by the logic implemented in its fn function. If the fn function returns a promise, the node will be considered "processing" until the promise is either resolved or rejected.

A visual node, on the other hand, is a group of other nodes connected together in a "nodes and wires" style. The processing of a visual node is determined by the processing of its child nodes.

Once a node has finished processing, it is considered completed. For code nodes, completion is determined by the end of the fn function. For visual nodes, completion is determined by the completion of all its child nodes.

In addition to these states, nodes can also have completion outputs and reactive inputs. Completion outputs are output pins that, when triggered, signify that the node has completed. If a node does not have any completion outputs, it will be considered completed as soon as no other nodes are "processing".

Reactive inputs are input pins that, when triggered, will cause the node to start processing again, even if it is already processing. This can be useful for implementing reactive behavior in a flow.

While a node is processing, it can access its internal state through the adv.state object. This state is cleared once the node is completed.

It is also possible for a node to report errors by calling the adv.onError function. This can be used to handle unexpected behavior or invalid input in a flow.

Finally, a node can specify cleanup logic to be executed when it is completed by calling the adv.onCleanup function. This
