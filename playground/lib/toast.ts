import _toast, { toastConfig } from "react-simple-toasts";
import "react-simple-toasts/dist/theme/light.css";

toastConfig({ theme: "light" });

export function toast(message: string, duration?: number) {
  return _toast(message, duration);
}
