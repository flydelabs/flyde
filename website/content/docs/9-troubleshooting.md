---
title: "Troubleshooting"
description: "Common issues and solutions when working with Flyde"
sidebar_position: 9
---

# Troubleshooting

## Visual Debugger

Flyde comes with a visual debugger that can help you troubleshoot your flows. When using the "test flow" feature from the editor, you can see the flow's execution in real-time, and inspect the values of each node's inputs and outputs.

When running flows locally using the `@flyde/loader` package, the runtime will try to connect to the local debugger server running from the visual editor automatically. If you're running the visual editor locally, you can see the flow's execution in real-time, and inspect the values of each node's inputs and outputs.

## Extension Troubleshooting

If something in the extension is not working as expected, you can look for errors in VSCode's dev tools. To do so, open the command palette and search for "Developer: Toggle Developer Tools". This will open a new window with the dev tools, where you can see errors and logs from everything running in VSCode, including the Flyde extension.

## Flow Runtime Troubleshooting

### Verbose Logging

Behind the scenes, Flyde uses the `debug` package to log debug information. You can enable debug logs by setting the `DEBUG` environment variable to `flyde:*`. For example, on a Unix-like system, you can run the following command to enable debug logs:

```sh
DEBUG=flyde:* node my-flow.js
```

## Reporting Issues

We're always looking to improve Flyde, and we'd love to hear from you. If you find a bug, have a feature request, or just want to ask a question, feel free to:

- open an issue on the [Flyde GitHub repository](https://www.github.com/flydelabs/flyde)
- join our [Discord server](https://www.flyde.dev/discord) and ask in the #flyde channel
