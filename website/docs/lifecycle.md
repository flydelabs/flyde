# Lifecycle of a Part
A part in Flyde is a self-contained unit of functionality that can be connected to other parts to form a flow. The lifecycle of a part consists of two states: waiting for inputs, and processing.

When a part is waiting for inputs, it is waiting for data to be passed to it through its input pins. Once all required input pins have received data, the part will start processing.

By default, input pins are "sticky", meaning that each new input will replace the previous one. However, input pins can also be configured to queue up different values in a first-in-first-out (FIFO) manner.

A native part's processing is determined by the logic implemented in its fn function. If the fn function returns a promise, the part will be considered "processing" until the promise is either resolved or rejected.

A grouped part, on the other hand, is a group of other parts connected together in a "nodes and wires" style. The processing of a grouped part is determined by the processing of its child parts.

Once a part has finished processing, it is considered completed. For native parts, completion is determined by the end of the fn function. For grouped parts, completion is determined by the completion of all its child parts.

In addition to these states, parts can also have completion outputs and reactive inputs. Completion outputs are output pins that, when triggered, signify that the part has completed. If a part does not have any completion outputs, it will be considered completed as soon as no other parts are "processing".

Reactive inputs are input pins that, when triggered, will cause the part to start processing again, even if it is already processing. This can be useful for implementing reactive behavior in a flow.

While a part is processing, it can access its internal state through the adv.state object. This state is cleared once the part is completed.

It is also possible for a part to report errors by calling the adv.onError function. This can be used to handle unexpected behavior or invalid input in a flow.

Finally, a part can specify cleanup logic to be executed when it is completed by calling the adv.onCleanup function. This