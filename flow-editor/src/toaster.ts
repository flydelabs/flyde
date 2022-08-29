import { Position, Toaster } from "@blueprintjs/core";
 
/** Singleton toaster instance. Create separate instances for different options. */
export const AppToaster = Toaster.create({
    className: "app-toaster",
    position: Position.BOTTOM_RIGHT
});


export const toastMsg = (message: string, intent?: 'danger' | 'success' | 'warning', timeout?: number) => {
    return AppToaster.show({message, intent, timeout});
}

export const updateToast = (key: string, newMessage: string, intent?: 'danger' | 'success' | 'warning') => {
    return AppToaster.show({message: newMessage, intent}, key);
}