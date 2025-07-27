import {
  Conditional,
  Debounce,
  Delay,
  GetGlobalState,
  Http,
  InlineValue,
  CodeExpression,
  Interval,
  LoopList,
  Publish,
  RoundRobin,
  SetGlobalState,
  SpreadList,
  Subscribe,
  Throttle,
  GetAttribute,
  MathNode,
  StringOps,
} from "@flyde/nodes/dist/all-browser";

import { Switch } from "@flyde/nodes/dist/ControlFlow/Switch.flyde";
import { Collect } from "@flyde/nodes/dist/Lists/Collect/Collect.flyde";
import { Note } from "@flyde/nodes/dist/Note/Note.flyde";
import { GetListElement } from "@flyde/nodes/dist/Lists/GetListElement.flyde";
import { Append } from "@flyde/nodes/dist/Lists/Append.flyde";
import { Reverse } from "@flyde/nodes/dist/Lists/Reverse.flyde";
import { GetAttribute as ObjectsGetAttribute } from "@flyde/nodes/dist/Objects/GetAttribute.flyde";
import { SetAttribute } from "@flyde/nodes/dist/Objects/SetAttribute.flyde";
import { DeleteAttribute } from "@flyde/nodes/dist/Objects/DeleteAttribute.flyde";
import { JSONParse } from "@flyde/nodes/dist/Objects/JSONParse.flyde";
import { JSONStringify } from "@flyde/nodes/dist/Objects/JSONStringify.flyde";
import { ObjectEntries } from "@flyde/nodes/dist/Objects/ObjectEntries.flyde";
import {
  CodeNodeSource,
  codeNodeToImportableEditorNode,
  NodeLibraryData,
  AdvancedCodeNode,
  isCodeNode,
} from "@flyde/core";

import { getUIBundle, hasUIBundle } from "./generated/ui-bundles";
import { getNodeSource } from "./generated/node-sources";

// Import browser-safe third-party nodes
import {
  Supabase,
  OpenAI,
  OpenAIResponsesAPI,
  Airtable,
  Anthropic,
  DiscordMessage,
  Firecrawl,
  LLMCondition,
  Notion,
  Resend,
  ScrapingBee,
  SendGrid,
  Slack,
  Tavily,
} from "@flyde/nodes/dist/ThirdParty/browser";

const nodesSource: CodeNodeSource = {
  type: "package",
  data: "@flyde/nodes",
};

// Enhances an advanced node with its UI bundle and source code if available
export function enhanceNodeWithUI(node: any): any {
  const advancedNode = { ...node } as AdvancedCodeNode<unknown>;

  let enhancedNode = node;

  if (advancedNode.editorConfig?.type === "custom" && hasUIBundle(node.id)) {
    enhancedNode = {
      ...node, editorConfig: {
        ...advancedNode.editorConfig,
        editorComponentBundleContent: getUIBundle(node.id)
      }
    };
  }

  // Add sourceCode for code nodes
  if (isCodeNode(enhancedNode)) {
    const sourceCode = getNodeSource(node.id);
    if (sourceCode) {
      enhancedNode = {
        ...enhancedNode,
        sourceCode
      };
    }
  }

  return enhancedNode;
}

export function getBrowserSafeNodesLibraryData(customNodes: any[] = []): NodeLibraryData {
  const groups = [];

  // Add custom nodes as the first group if any exist
  if (customNodes.length > 0) {
    groups.push({
      title: "Custom Nodes",
      nodes: customNodes.map((node) => {
        const customNodesSource: CodeNodeSource = {
          type: "file",
          data: `${node.id}.flyde.ts`,
        };
        return codeNodeToImportableEditorNode(enhanceNodeWithUI(node), customNodesSource);
      }),
    });
  }

  groups.push(
    {
      title: "Essentials",
      nodes: [
        InlineValue,
        CodeExpression,
        GetAttribute,
        Http,
        Conditional,
        Switch,
        Note,
        MathNode,
        StringOps
      ].map((node) => codeNodeToImportableEditorNode(enhanceNodeWithUI(node), nodesSource)),
    },
    {
      title: 'Integrations',
      nodes: [
        Airtable,
        Anthropic,
        DiscordMessage,
        Firecrawl,
        // Note: GoogleSheets is excluded as it imports google-auth-library
        LLMCondition,
        Notion,
        OpenAI,
        OpenAIResponsesAPI,
        Resend,
        ScrapingBee,
        SendGrid,
        Slack,
        Supabase,
        Tavily,
      ].map((node) => codeNodeToImportableEditorNode(enhanceNodeWithUI(node), nodesSource)),
    },
    {
      title: "Lists",
      nodes: [
        LoopList,
        SpreadList,
        Collect,
        GetListElement,
        Append,
        Reverse,
      ].map((node) => codeNodeToImportableEditorNode(enhanceNodeWithUI(node), nodesSource)),
    },
    {
      title: "Control Flow",
      nodes: [
        Delay,
        Throttle,
        Debounce,
        Conditional,
        Interval,
        RoundRobin,
        Switch,
        Publish,
        Subscribe,
      ].map((node) => codeNodeToImportableEditorNode(enhanceNodeWithUI(node), nodesSource)),
    },
    {
      title: "Objects",
      nodes: [
        ObjectsGetAttribute,
        SetAttribute,
        DeleteAttribute,
        JSONParse,
        JSONStringify,
        ObjectEntries,
      ].map((node) => codeNodeToImportableEditorNode(enhanceNodeWithUI(node), nodesSource)),
    },
    {
      title: "State",
      nodes: [GetGlobalState, SetGlobalState].map((node) =>
        codeNodeToImportableEditorNode(node, nodesSource)
      ),
    },
    {
      title: "Timing",
      nodes: [Delay, Throttle, Debounce, Interval, RoundRobin].map((node) =>
        codeNodeToImportableEditorNode(node, nodesSource)
      ),
    });


  return {
    groups
  };
}