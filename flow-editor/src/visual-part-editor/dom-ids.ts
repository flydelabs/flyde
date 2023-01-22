import { PinType } from "@flyde/core";

export const getInstanceDomId = (parentInsId: string, insId: string) => {
  return `ins:${parentInsId}:${insId}`.replace(/\s+/g, "-");
};

export const getPinDomId = (
  parentInsId: string,
  insId: string,
  pinId: string,
  type: PinType
) => {
  return `pin:${type}:${parentInsId}:${insId}:${pinId}`.replace(/\s+/g, "-");
};

export const getMainPinDomId = (
  insId: string,
  pinId: string,
  type: PinType
) => {
  return `main-pin:${insId}:${pinId}:${type}`.replace(/\s+/g, "-");
};
