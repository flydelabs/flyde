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
} from "./all-browser";

import { Switch } from "./ControlFlow/Switch.flyde";
import { Collect } from "./Lists/Collect/Collect.flyde";
import { Note } from "./Note/Note.flyde";
import * as Lists from "./Lists";
import * as Objects from "./Objects";
import {
  CodeNodeSource,
  codeNodeToImportableEditorNode,
  NodeLibraryData,
} from "@flyde/core";
import { Airtable, Anthropic, DiscordMessage, Firecrawl, LLMCondition, Notion, Resend, ScrapingBee, SendGrid, Slack, Supabase, Tavily } from "./ThirdParty/server";
import { OpenAIResponsesAPI } from "./ThirdParty/openai-responses.flyde";
import { GoogleSheets } from "./ThirdParty/googlesheets.flyde";

const nodesSource: CodeNodeSource = {
  type: "package",
  data: "@flyde/nodes",
};

export function getBaseNodesLibraryData(): NodeLibraryData {
  return {
    groups: [
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
        ].map((node) => codeNodeToImportableEditorNode(node, nodesSource)),
      },
      {
        title: 'Integrations',
        nodes: [
          Airtable,
          Anthropic,
          DiscordMessage,
          Firecrawl,
          GoogleSheets,
          LLMCondition,
          Notion,
          OpenAIResponsesAPI,
          Resend,
          ScrapingBee,
          SendGrid,
          Slack,
          Supabase,
          Tavily,
        ].map((node) => codeNodeToImportableEditorNode(node, nodesSource)),
      },
      {
        title: "Lists",
        nodes: [
          LoopList,
          SpreadList,
          Collect,
          Lists.GetListElement,
          Lists.Append,
          Lists.Reverse,
        ].map((node) => codeNodeToImportableEditorNode(node, nodesSource)),
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
        ].map((node) => codeNodeToImportableEditorNode(node, nodesSource)),
      },
      {
        title: "Objects",
        nodes: [
          Objects.GetAttribute,
          Objects.SetAttribute,
          Objects.DeleteAttribute,
          Objects.JSONParse,
          Objects.JSONStringify,
          Objects.ObjectEntries,
        ].map((node) => codeNodeToImportableEditorNode(node, nodesSource)),
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
      },
    ],
  };
}
