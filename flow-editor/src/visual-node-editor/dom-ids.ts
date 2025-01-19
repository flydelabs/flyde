import { fullInsIdPath, PinType } from "@flyde/core";

export const getInstanceDomId = (insId: string, ancestorsInsIds?: string) => {
  return `ins:${fullInsIdPath(insId, ancestorsInsIds)}`.replace(/\s+/g, "-");
};

export const getMainInstanceIndicatorDomId = (
  insId: string,
  ancestorsInsIds?: string
) => {
  return `main-ins:${fullInsIdPath(insId, ancestorsInsIds)}`.replace(
    /\s+/g,
    "-"
  );
};

export const getMainPinDomId = (
  insId: string,
  pinId: string,
  type: PinType
) => {
  return `main-pin:${insId}:${pinId}:${type}`.replace(/\s+/g, "-");
};

export interface GetPinDomIdParams {
  fullInsIdPath: string;
  pinId: string;
  pinType: PinType;
  isMain: boolean;
}

export const getPinDomId = ({
  pinType,
  fullInsIdPath,
  pinId,
  isMain,
}: GetPinDomIdParams) => {
  return `${
    isMain ? "main-" : ""
  }pin:${pinType}:${fullInsIdPath}:${pinId}`.replace(/\s+/g, "-");
};

export const getPinDomHandleId = ({
  pinType,
  fullInsIdPath,
  pinId,
  isMain,
}: GetPinDomIdParams) => {
  return `pin-handle:${pinType}:${fullInsIdPath}:${
    isMain ? "main-" : ""
  }${pinId}`.replace(/\s+/g, "-");
};
