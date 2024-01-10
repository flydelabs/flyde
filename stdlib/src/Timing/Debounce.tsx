import { MacroEditorComp } from "../lib/MacroEditorComp";
import { IntervalConfig } from "./Timing.flyde";
import { TimedNodeEditor } from "./TimedNodeEditor";

const DebounceEditor: MacroEditorComp<IntervalConfig> = TimedNodeEditor;

export default DebounceEditor;
