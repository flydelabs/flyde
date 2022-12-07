import { OMap } from "../..";

export enum DebuggerEventType {
    INPUT_CHANGE = "i",
    OUTPUT_CHANGE = "o",
    PROCESSING_CHANGE = "pc",
    ERROR = "err",
    INPUTS_STATE_CHANGE = "isc",
  }
  
  export const MAJOR_DEBUGGER_EVENT_TYPES: DebuggerEventType[] = [
    DebuggerEventType.INPUT_CHANGE,
    DebuggerEventType.OUTPUT_CHANGE,
    DebuggerEventType.ERROR,
  ];
  
  export const MINOR_DEBUGGER_EVENT_TYPES: DebuggerEventType[] = [
    DebuggerEventType.PROCESSING_CHANGE,
    DebuggerEventType.INPUTS_STATE_CHANGE,
  ];

  export type BaseDebuggerEvent<T extends DebuggerEventType> = {
    type: T;
    insId: string;
    parentInsId: string;
    val: DebuggerEventTypeData[T];
  };

  export type PinDebuggerEvent<T extends DebuggerEventType> = {
    pinId: string;
  } & BaseDebuggerEvent<T>;
  
  export type DebuggerEventTypeData = {
    [DebuggerEventType.INPUTS_STATE_CHANGE]: OMap<number>;
    [DebuggerEventType.PROCESSING_CHANGE]: boolean;
    [DebuggerEventType.ERROR]: any;
    [DebuggerEventType.INPUT_CHANGE]: string;
    [DebuggerEventType.OUTPUT_CHANGE]: string;
  };
  
  export type MajorDebuggerEvent =
    | PinDebuggerEvent<DebuggerEventType.OUTPUT_CHANGE>
    | PinDebuggerEvent<DebuggerEventType.INPUT_CHANGE>
    | BaseDebuggerEvent<DebuggerEventType.ERROR>;
  
  export type MinorDebuggerEvent =
    | BaseDebuggerEvent<DebuggerEventType.INPUTS_STATE_CHANGE>
    | BaseDebuggerEvent<DebuggerEventType.PROCESSING_CHANGE>;
  
  export type DebuggerEvent = MajorDebuggerEvent | MinorDebuggerEvent;