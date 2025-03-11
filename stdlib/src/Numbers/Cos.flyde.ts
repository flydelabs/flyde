import { InternalCodeNode } from "@flyde/core";

const namespace = "Numbers";
export const Cos: InternalCodeNode = {
  id: "Cos",
  defaultStyle: {
    icon: "fa-cos",
  },
  namespace,
  description: "Emits the cosine of an angle",
  inputs: { angle: { description: "Angle in radians" } },
  outputs: { cosine: { description: "The cosine of angle" } },
  run: ({ angle }, { cosine }) => cosine.next(Math.cos(angle)),
};
