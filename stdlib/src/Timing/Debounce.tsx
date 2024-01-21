import { MacroEditorComp } from "../lib/MacroEditorComp";
import { TimedNodeEditor } from "./TimedNodeEditor";
import { TimingNodeConfig } from "./common";

const DebounceEditor: MacroEditorComp<TimingNodeConfig> = TimedNodeEditor;

export default DebounceEditor;
