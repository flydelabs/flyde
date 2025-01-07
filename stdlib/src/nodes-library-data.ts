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
} from "./all-browser";

import { Switch } from "./ControlFlow/Switch.flyde";
import { Collect } from "./Lists/Collect/Collect.flyde";
import { Comment } from "./Comment/Comment.flyde";
import * as Lists from "./Lists";
import * as Objects from "./Objects";

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
          Comment,
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
    ],
  };
}
