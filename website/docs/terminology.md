# Terminology Reference

| Term | Definition |
|------|------------|
| **Part** | A unit of functionality that can be connected to other parts in a flow. Parts can be  |native (with functionality written in JavaScript or TypeScript) or a grouped part, which is a group of other parts arranged in a "nodes and wires" style.
| **Grouped part** | A part that is made up of other parts arranged in a "nodes and wires" style. |
| **Native part** | A part with functionality written in JavaScript or TypeScript. |
| **Input pin** | A pin on a part that receives data. Each part can have zero or more input pins. |
| **Output pin** | A pin on a part that sends data. Each part can have zero or more output pins. For  |example, a "Split array" part might have one input pin for an array and two output pins for the first and second halves of the array.
| **Main flow input/output pin** | Special input/output pins that are used to pass data into or out  |of the main flow. These are typically used to pass data between the main flow and external code (e.g. a user interface).
| **Connection** | A link between two pins that allows data to flow from one part to another. |
| **Reactive inputs** | Input pins that trigger the part to execute whenever their value changes. |
| **Completion outputs** | Output pins that indicate when the part has finished executing. These are  |typically used to coordinate the flow of data between parts