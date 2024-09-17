import {
  CodeExpression,
  Conditional,
  Debounce,
  Delay,
  GetAttribute,
  GetGlobalState,
  Http,
  InlineValue,
  Interval,
  LoopList,
  Publish,
  RoundRobin,
  SetGlobalState,
  SpreadList,
  Subscribe,
  Throttle,
} from "./all-browser";

import * as Strings from "./Strings.flyde";
import { Switch } from "./ControlFlow/Switch.flyde";
import { Collect } from "./Lists/Collect/Collect.flyde";
import { Comment } from "./Misc/Comment.flyde";
import * as Numbers from "./Numbers.flyde";
import * as Lists from "./Lists/Lists.flyde";
import * as Objects from "./Objects/Objects.flyde";

export function getUnresolvedNodesLibraryData() {
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
        ],
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
        ],
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
        ],
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
        ],
      },
      {
        title: "State",
        nodes: [GetGlobalState, SetGlobalState],
      },
      {
        title: "Timing",
        nodes: [Delay, Throttle, Debounce, Interval, RoundRobin],
      },
      {
        title: "Strings",
        nodes: [
          Strings.ToLowerCase,
          Strings.ToUpperCase,
          Strings.Substring,
          Strings.Length,
          Strings.IndexOf,
          Strings.Replace,
          Strings.Split,
        ],
      },
      {
        title: "Math",
        nodes: [
          Numbers.Add,
          Numbers.Subtract,
          Numbers.Multiply,
          Numbers.Divide,
          Numbers.Modulo,
          Numbers.Power,
        ],
      },
      {
        title: "Misc",
        nodes: [Comment],
      },
    ],
  };
}
