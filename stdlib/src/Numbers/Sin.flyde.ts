import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Sin: InternalCodeNode = {
  id: "Sin",
  defaultStyle: {
    icon: "fa-sin",
  },
  namespace,
  description: "Emits the sine of an angle",
  inputs: { angle: { description: "Angle in radians" } },
  outputs: { sine: { description: "The sine of angle" } },
  run: ({ angle }, { sine }) => sine.next(Math.sin(angle)),
};
