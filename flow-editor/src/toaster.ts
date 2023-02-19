import { Position, Toaster } from "@blueprintjs/core";

/** Singleton toaster instance. Create separate instances for different options. */

// Toaster triggers document as a side effect,
const createToaster = () => {
  try {
    return Toaster.create({
      className: "app-toaster",
      position: Position.BOTTOM_RIGHT,
    });
  } catch (e) {
    return {} as any;
  }
};
export const AppToaster = createToaster();

export const toastMsg = (
  message: string | JSX.Element,
  intent?: "danger" | "success" | "warning" | "info",
  timeout?: number
) => {
  return AppToaster.show({ message, intent, timeout });
};

export const updateToast = (
  key: string,
  newMessage: string,
  intent?: "danger" | "success" | "warning"
) => {
  return AppToaster.show({ message: newMessage, intent }, key);
};
