import { useEffect } from "react";

const blockList = [
    {metaKey: true, key: 'c'},
    {metaKey: true, key: 'v'},
]

export const useHotkeysPropagationVsCode = () => {
    // https://github.com/microsoft/vscode/issues/65452#issuecomment-586485815
    const handler = (originalEvent: KeyboardEvent) => {
        const serializableEvent = {
            altKey: originalEvent.altKey,
            code: originalEvent.code,
            ctrlKey: originalEvent.ctrlKey,
            isComposing: originalEvent.isComposing,
            key: originalEvent.key,
            location: originalEvent.location,
            metaKey: originalEvent.metaKey,
            repeat: originalEvent.repeat,
            shiftKey: originalEvent.shiftKey
        }
        
        if (blockList.find(e => e.metaKey === serializableEvent.metaKey && e.key.toLowerCase() === serializableEvent.key.toLowerCase())) {
            // console.log('ignorng', originalEvent);
            
            return;
        } else {
            window.parent.postMessage({type: 'hotkeys-propagation', keyboardEvent: serializableEvent} , '*')
        }
        
    }
    return useEffect(() => {
        document.addEventListener('keydown', handler);

        return () => document.removeEventListener('keydown', handler);
    });
}