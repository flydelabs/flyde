---
title: "Third-party Nodes"
description: "Learn how to install and use third-party nodes in Flyde"
sidebar_position: 8
---

# Third-Party Nodes

Flyde leverages the npm ecosystem to enable importing of third-party nodes into flows.

## Using Third-Party Nodes

To use a third-party node in your flow, you need to the npm package that contains the node. Flyde will automatically dependencies that contain Flyde nodes, and make them available in the node picker.

## Publishing Third-Party Nodes

To publish Flyde nodes to npm, you need to add a "flyde.exposes" property to your package.json - an array of globs that will contain Flyde nodes (either code nodes or visual nodes). Additionally, you should make sure that the package name starts with "flyde-".

This will hint to the Flyde editor that your package contains nodes, and it will automatically suggest them to the node library once the package is installed.

:::info
For better community discoverability, we recommend adding the "flyde" keyword to your package.json.
:::

### Example

```json
{
  "name": "flyde-my-nodes",
  "version": "1.0.0",
  "flyde": {
    "exposes": ["nodes/**/*.flyde.ts", "nodes/**/*.flyde"]
  }
}
```

:::note
Flyde's standard library is also published as an npm package, `@flyde/nodes`. You can use it as a reference for how to publish your own nodes.
:::
