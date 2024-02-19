import { MacroEditorComp } from "../../lib/MacroEditorComp";
import { GetAttributeConfig } from "./GetAttribute.flyde";
import { SimpleStringMacroEditor } from "../../lib/SimpleStringMacroEditor";

const GetAttributeEditor: MacroEditorComp<GetAttributeConfig> =
  SimpleStringMacroEditor<"key">("key", "Key:");
export default GetAttributeEditor;
