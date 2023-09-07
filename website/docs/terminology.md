---
sidebar_position: 3
---

# Terminology Reference

| Term                           | Definition                                                                                                                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Node**                       | A unit of functionality that can be connected to other nodes in a flow. Nodes can becode (with functionality written in JavaScript or TypeScript) or a visual node, which is a group of other nodes (visual or code) arranged in a "nodes and wires" style. |
| **Grouped node**               | A node that is made up of other nodes arranged in a "nodes and wires" style.                                                                                                                                                                                |
| **Code node**                  | A node with functionality written in JavaScript or TypeScript.                                                                                                                                                                                              |
| **Input pin**                  | A pin on a node that receives data. Each node can have zero or more input pins.                                                                                                                                                                             |
| **Output pin**                 | A pin on a node that sends data. Each node can have zero or more output pins. For example, a "Split array" node might have one input pin for an array and two output pins for the first and second halves of the array.                                     |
| **Main flow input/output pin** | Special input/output pins that are used to pass data into or out of the main flow. These are typically used to pass data between the main flow and external code (e.g. a user interface).                                                                   |
| **Connection**                 | A link between two pins that allows data to flow from one node to another.                                                                                                                                                                                  |
| **Reactive inputs**            | Input pins that trigger the node to execute whenever their value changes.                                                                                                                                                                                   |
| **Completion outputs**         | Output pins that indicate when the node has finished executing. These are                                                                                                                                                                                   | typically used to coordinate the flow of data between nodes |
