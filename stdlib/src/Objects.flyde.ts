import { partFromSimpleFunction } from "@flyde/core";

const namespace = "Objects";

export const JSONParse = partFromSimpleFunction({
  id: "JSON Parse",
  icon: "fa-glasses",
  namespace,
  description: "Parses a JSON string into an object",
  inputs: [{ name: "json", description: "JSON string to parse" }],
  output: { name: "object", description: "The parsed object" },
  fn: (json) => JSON.parse(json),
});

export const JSONStringify = partFromSimpleFunction({
  id: "JSON Stringify",
  icon: "fa-pen-fancy",
  namespace,
  description: "Stringifies an object into a JSON string",
  inputs: [{ name: "object", description: "Object to stringify" }],
  output: { name: "json", description: "The stringified JSON" },
  fn: (object) => JSON.stringify(object),
});

export const ObjectKeys = partFromSimpleFunction({
  id: "Keys",
  icon: "fa-key",
  namespace,
  description: "Emits the keys of an object",
  inputs: [{ name: "object", description: "Object to get keys of" }],
  output: { name: "keys", description: "The keys of object" },
  fn: (object) => Object.keys(object),
});

export const ObjectValues = partFromSimpleFunction({
  id: "Values",
  namespace,
  description: "Emits the values of an object",
  inputs: [{ name: "object", description: "Object to get values of" }],
  output: { name: "values", description: "The values of object" },
  fn: (object) => Object.values(object),
});

export const ObjectEntries = partFromSimpleFunction({
  id: "Entries",
  namespace,
  icon: "fa-box",
  description: "Emits the entries of an object",
  inputs: [{ name: "object", description: "Object to get entries of" }],
  output: { name: "entries", description: "The entries of object" },
  fn: (object) => Object.entries(object),
});

export const ObjectFromEntries = partFromSimpleFunction({
  id: "From Entries",
  namespace,
  icon: "fa-box",
  description: "Creates an object from an array of entries",
  inputs: [
    { name: "entries", description: "Array of entries to create object from" },
  ],
  output: { name: "object", description: "The created object" },
  fn: (entries) => Object.fromEntries(entries),
});

export const ObjectAssign = partFromSimpleFunction({
  id: "Assign",
  namespace,
  icon: "fa-box",
  description: "Assigns properties from one or more objects to a target object",
  inputs: [
    { name: "target", description: "Target object to assign properties to" },
    {
      name: "sources",
      description: "One or more objects to assign properties from",
    },
  ],
  output: { name: "object", description: "The target object" },
  fn: (target, ...sources) => Object.assign(target, ...sources),
});

export const GetAttribute = partFromSimpleFunction({
  id: "Get Attribute",
  namespace,
  icon: "fa-magnifying-glass",
  description: "Gets an attribute from an object",
  inputs: [
    { name: "object", description: "Object to get attribute from" },
    { name: "attribute", description: "Attribute to get" },
  ],
  output: { name: "value", description: "The value of the attribute" },
  customViewCode: `<% if (inputs.attribute) { %> Get "<%- inputs.attribute %>"<% } else { %> Get Attribute <% } %>`,
  fn: (object, attribute) => {
    // get attribute from object while supporting dot notation
    return attribute.split(".").reduce((obj, i) => obj[i], object);
  },
});

export const SetAttribute = partFromSimpleFunction({
  id: "Set Attribute",
  namespace,
  icon: "fa-box",
  description: "Sets an attribute on an object",
  inputs: [
    { name: "object", description: "Object to set attribute on" },
    { name: "attribute", description: "Attribute to set" },
    { name: "value", description: "Value to set attribute to" },
  ],
  customViewCode: `<% if (inputs.attribute) { %> Set "<%- inputs.attribute %>"<% } else { %> Set Attribute <% } %>`,
  output: { name: "object", description: "The object with the attribute set" },
  fn: (object, attribute, value) => {
    // set attribute on object while supporting dot notation
    const attributes = attribute.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object);
    target[last] = value;
    return object;
  },
});

export const DeleteAttribute = partFromSimpleFunction({
  id: "Delete Attribute",
  namespace,
  icon: "fa-box",
  description: "Deletes an attribute from an object",
  inputs: [
    { name: "object", description: "Object to delete attribute from" },
    { name: "attribute", description: "Attribute to delete" },
  ],
  customViewCode: `<% if (inputs.attribute) { %> Delete "<%- inputs.attribute %>"<% } else { %> Delete Attribute <% } %>`,
  output: {
    name: "object",
    description: "The object with the attribute deleted",
  },
  fn: (object, attribute) => {
    // delete attribute from object while supporting dot notation
    const attributes = attribute.split(".");
    const last = attributes.pop();
    const target = attributes.reduce((obj, i) => obj[i], object);
    delete target[last];
    return object;
  },
});
