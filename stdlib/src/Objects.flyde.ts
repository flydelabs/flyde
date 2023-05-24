import { CodePart } from "@flyde/core";

const namespace = "Objects";

export const JSONParse: CodePart = {
  id: "JSON Parse",
  defaultStyle: {
    icon: "fa-glasses",
  },
  namespace,
  description: "Parses a JSON string into an object",
  inputs: { json: { description: "JSON string to parse" } },
  outputs: { object: { description: "The parsed object" } },
  run: ({ json }, { object }) => object.next(JSON.parse(json)),
};

export const JSONStringify: CodePart = {
  id: "JSON Stringify",
  defaultStyle: {
    icon: "fa-pen-fancy",
  },
  namespace,
  description: "Stringifies an object into a JSON string",
  inputs: { object: { description: "Object to stringify" } },
  outputs: { json: { description: "The stringified JSON" } },
  run: ({ object }, { json }) => json.next(JSON.stringify(object)),
};

export const ObjectKeys: CodePart = {
  id: "Keys",
  defaultStyle: {
    icon: "fa-key",
  },
  namespace,
  description: "Emits the keys of an object",
  inputs: { object: { description: "Object to get keys of" } },
  outputs: { keys: { description: "The keys of object" } },
  run: ({ object }, { keys }) => keys.next(Object.keys(object)),
};

export const ObjectValues: CodePart = {
  id: "Values",
  namespace,
  description: "Emits the values of an object",
  inputs: { object: { description: "Object to get values of" } },
  outputs: { values: { description: "The values of object" } },
  run: ({ object }, { values }) => values.next(Object.values(object)),
};

export const ObjectEntries: CodePart = {
  id: "Entries",
  defaultStyle: {
    icon: "fa-box",
  },
  namespace,
  description: "Emits the entries of an object",
  inputs: { object: { description: "Object to get entries of" } },
  outputs: { entries: { description: "The entries of object" } },
  run: ({ object }, { entries }) => entries.next(Object.entries(object)),
};

export const ObjectFromEntries: CodePart = {
  id: "From Entries",
  namespace,
  defaultStyle: {
    icon: "fa-box",
  },
  description: "Creates an object from an array of entries",
  inputs: {
    entries: {
      description: "Array of entries to create object from",
    },
  },
  outputs: {
    object: {
      description: "The created object",
    },
  },
  run: ({ entries }, { object }) => object.next(Object.fromEntries(entries)),
};

export const ObjectAssign: CodePart = {
  id: "Assign",
  namespace,
  defaultStyle: {
    icon: "fa-box",
  },
  description: "Assigns properties from one or more objects to a target object",
  inputs: {
    target: {
      description: "Target object to assign properties to",
    },
    sources: {
      description: "One or more objects to assign properties from",
    },
  },
  outputs: {
    object: {
      description: "The target object",
    },
  },
  run: ({ target, sources }, { object }) =>
    object.next(Object.assign(target, ...sources)),
};

export const GetAttribute: CodePart = {
  id: "Get Attribute",
  searchKeywords: ["pick", "dot"],
  namespace,
  defaultStyle: {
    icon: "fa-magnifying-glass",
  },
  description: "Gets an attribute from an object",
  inputs: {
    object: {
      description: "Object to get attribute from",
    },
    attribute: {
      description: "Attribute to get",
    },
  },
  outputs: {
    value: {
      description: "The value of the attribute",
    },
  },
  customViewCode: `<% if (inputs.attribute) { %> Get "<%- inputs.attribute %>"<% } else { %> Get Attribute <% } %>`,
  run: ({ object, attribute }, { value }) =>
    value.next(attribute.split(".").reduce((obj, i) => obj[i], object)),
};

export const SetAttribute: CodePart = {
  id: "Set Attribute",
  searchKeywords: ["dot"],
  namespace,
  defaultStyle: {
    icon: "fa-box",
  },
  description: "Sets an attribute on an object",
  inputs: {
    object: {
      description: "Object to set attribute on",
    },
    attribute: {
      description: "Attribute to set",
    },
    value: {
      description: "Value to set attribute to",
    },
  },
  outputs: {
    object: {
      description: "The object with the attribute set",
    },
  },
  customViewCode: `<% if (inputs.attribute) { %> Set "<%- inputs.attribute %>"<% } else { %> Set Attribute <% } %>`,
  run: ({ object, attribute, value }, { object: outputObject }) => {
    const attributes = attribute.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object);
    target[last] = value;
    return outputObject.next(object);
  },
};

export const DeleteAttribute: CodePart = {
  id: "Delete Attribute",
  defaultStyle: {
    icon: "fa-box",
  },
  namespace,
  description: "Deletes an attribute from an object",
  inputs: {
    object: { description: "Object to delete attribute from" },
    attribute: { description: "Attribute to delete" },
  },
  customViewCode: `<% if (inputs.attribute?.value) { %> Delete "<%- inputs.attribute.value %>"<% } else { %> Delete Attribute <% } %>`,
  outputs: {
    object: {
      description: "The object with the attribute deleted",
    },
  },
  run: ({ object, attribute }, { object: outputObject }) => {
    // delete attribute from object while supporting dot notation
    const attributes = attribute.value.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object.value);
    delete target[last];
    outputObject.next(object.value);
  },
};

export const PropertyEquals: CodePart = {
  id: "Property Equals",
  namespace,
  defaultStyle: {
    icon: "fa-equals",
  },
  description:
    'Emits the object to the "true" output if an object\'s property equals a value, otherwise emits to the "false" output',
  inputs: {
    object: { description: "Object to check property of" },
    attribute: { description: "Attribute to check" },
    value: { description: "Value to check attribute against" },
  },
  outputs: {
    true: { description: "Emitted if the attribute equals the value" },
    false: { description: "Emitted if the attribute does not equal the value" },
  },
  customViewCode: `<% if (inputs.attribute) { %> "<%- inputs.attribute %>" equals "<%- inputs.value %>"<% } else { %> Property Equals <% } %>`,
  run: (inputs, outputs) => {
    // get attribute from object while supporting dot notation
    const value = inputs.attribute
      .split(".")
      .reduce((obj, i) => obj[i], inputs.object);
    if (value === inputs.value) {
      outputs.true.next(inputs.object);
    } else {
      outputs.false.next(inputs.object);
    }
  },
};
