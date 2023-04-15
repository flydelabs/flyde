import { PinType } from "@flyde/core";

export interface AnalyticsEventsMap {
  hotkeyUsed: { hotkey: string };
  addPartMenuOpen: {};
  addPart: { partId: string; source: string };
  addValueModalOpen: { source?: string };
  addValue: { placeholdersCount: number; type?: string };
  helpMenuItem: { item: string };
  helpMenuOpen: {};
  deleteInstances: { count: number };
  openInspectMenu: { source: string };
  groupSelected: { count: number };
  unGroupPart: { instancesCount: number };
  createConnection: { source: string };
  removeConnection: {};
  addIoPin: { type: PinType };
  changeStyle: { isDefault: boolean };
  editReactiveInputs: { count: number };
  editCompletionOutputs: { count: number };
  togglePinSticky: { isSticky: boolean };
}

export type AnalyticsEvent = keyof AnalyticsEventsMap;

export type ReportEvent = <K extends AnalyticsEvent = AnalyticsEvent>(
  eventName: K,
  data: AnalyticsEventsMap[K]
) => void;
