---
title: "Core Concepts"
description: "Learn about the fundamental concepts of Flyde: nodes, connections, and flows"
sidebar_position: 2
---

# Core Concepts

This article introduces some of the core concepts of Flyde.
:::tip
A deeper dive into each concept is available in the [advanced concepts](../advanced-concepts) article.
:::

## Nodes

Each node in Flyde is an isolated, modular unit that runs some logic when it is executed.
A node has **inputs** and **outputs** that allow it to interact with other nodes.

When a node runs, it can read the values of its inputs, and emit values to its outputs. The logic of a node is implemented either using code (TypeScript or JavaScript), or using Flyde, by grouping other nodes together.

For example, a node that adds two numbers together, will have two inputs, and one output, and will emit the sum of the two inputs to its output, once both inputs are received values.

Unlike regular functions, nodes can have multiple outputs, and can emit values to their outputs multiple times. For example, a node might receive a tuple of values, and emit each value to a different output.

## Connections

Nodes are connected together using **connections**. Connections are the wires that connect nodes together, and allow them to communicate. Each connection connects an output of one node, to an input of another node.

Whenever a node emits a value to one of its outputs, the value is sent to all the inputs of nodes that are connected to that output. The connected nodes will receive emitted value.

## Flow

A Flyde flow consists of **nodes** and **connections** between them. Nodes are the building blocks of a flow, and connections are the wires that connect them together.

A flow can also have **inputs** and **outputs** that allow it to interact with the outside world.

![Flyde Core Concepts](/docs/concepts-overview.png)
