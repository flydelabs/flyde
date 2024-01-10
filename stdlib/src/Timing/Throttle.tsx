import { MacroEditorComp } from "../lib/MacroEditorComp";
import { IntervalConfig } from "./Timing.flyde";
import { TimedNodeEditor } from "./TimedNodeEditor";

const ThrottleEditor: MacroEditorComp<IntervalConfig> = TimedNodeEditor;

export default ThrottleEditor;
