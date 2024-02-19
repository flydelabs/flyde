import { InputPinMap, MacroNode } from "@flyde/core";
import { ConfigurableInput } from "../../lib/ConfigurableInput";

export interface GetAttributeConfig {
  key: ConfigurableInput<{ value: string }>;
}

export const GetAttribute: MacroNode<GetAttributeConfig> = {
  id: "GetAttribute",
  searchKeywords: ["pick", "dot"],
  namespace: "Lists",
  defaultStyle: {
    icon: "fa-magnifying-glass",
  },
  description: "Gets an attribute from an object",
  definitionBuilder: (config) => {
    const inputs: InputPinMap = {
      object: {
        description: "Object to get attribute from",
      },
    };
    if (config.key.mode === "dynamic") {
      inputs.attribute = {
        description: "Attribute to get",
      };
    }
    return {
      inputs,
      outputs: {
        value: {
          description: "The value of the attribute",
        },
      },
      displayName: `Get Attribute${
        config.key.mode === "static" ? ` "${config.key.value}"` : ""
      }`,
    };
  },

  runFnBuilder:
    (config) =>
    ({ object, attribute }, { value }) => {
      const _attribute =
        config.key.mode === "static" ? config.key.value : attribute;
      value.next(_attribute.split(".").reduce((obj, i) => obj[i], object));
    },
  defaultData: { key: { mode: "static", value: "" } },
  editorComponentBundlePath: "../../../../dist/ui/GetAttribute.js",
};
