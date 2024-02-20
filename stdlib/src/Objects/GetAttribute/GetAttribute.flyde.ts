import { ConfigurableInput, InputPinMap, MacroNode } from "@flyde/core";
export interface GetAttributeConfig {
  key: ConfigurableInput<string>;
}

export const GetAttribute: MacroNode<GetAttributeConfig> = {
  id: "GetAttribute",
  displayName: "Get Attribute",
  searchKeywords: ["pick", "dot"],
  namespace: "Objects",
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
  editorConfig: {
    type: "structured",
    fields: [
      {
        type: {
          value: "string",
        },
        configKey: "key",
        label: "Key",
        defaultValue: "",
        allowDynamic: true,
      },
    ],
  },
};
