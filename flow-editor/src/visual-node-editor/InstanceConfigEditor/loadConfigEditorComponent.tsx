import { EditorCodeNodeDefinition, EditorCodeNodeInstance, ConfigurableEditorComp } from "@flyde/core";
import React from "react";
import ReactDOM from "react-dom";
import { StructuredConfigurableEditorComp } from "./StructuredConfigurableEditorComp";

export function loadConfigEditorComponent(
  instance: EditorCodeNodeInstance
): ConfigurableEditorComp<unknown> {
  const w: any = window;
  w.React = React;
  w.ReactDOM = ReactDOM;

  const { nodeId, node } = instance;
  const exportId = `__NodeConfig__${nodeId}`;
  const editorConfig = (node as EditorCodeNodeDefinition).editorConfig;

  if (editorConfig.type === "custom") {
    try {
      // eslint-disable-next-line no-eval
      eval(editorConfig.editorComponentBundleContent);

      const compModule = w[exportId];
      const comp = compModule?.default || compModule;

      if (!comp) {
        return function () {
          return (
            <span>
              Failed to load configurable node - please check that bundle that {nodeId}{" "}
              exposes an editable component to window.{exportId}
            </span>
          );
        };
      }

      w.Comp = comp;

      return comp;
    } catch (e) {
      console.error(e);
      return function () {
        return (
          <span>
            Failed to load configurable node - please check that bundle that {nodeId}{" "}
            exposes an editable component to window.{exportId}
          </span>
        );
      };
    }
  } else {
    return StructuredConfigurableEditorComp(editorConfig);
  }
}
