import { PinType } from "@flyde/core";


export const getInstanceDomId = (parentInsId: string, insId: string) => {
    return `ins-view-${parentInsId}.${insId}`.replace(/\s+/g, "-");
}

export const getPinDomId = (parentInsId: string, insId: string, pinId: string, type: PinType) => {
    return `pin-${parentInsId}.${insId}-${pinId}-${type}`.replace(/\s+/g, "-");
}

export const getMainPinDomId = (insId: string, pinId: string, type: PinType) => {
    return `pin-main-${insId}-${pinId}-${type}`.replace(/\s+/g, "-");
}

