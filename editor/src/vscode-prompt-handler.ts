import { PromptFunction } from "@flyde/flow-editor/dist/lib/react-utils/prompt";
import cuid from "cuid";

export const vscodePromptHandler: PromptFunction = (text, defaultValue) => {

    const id = cuid();

    window.addEventListener('message', (e) => {
        console.log(44, e);
    });
    window.parent.postMessage({type: 'prompt', text, defaultValue, id, source: 'app'}, '*');

    return new Promise((res) => {
        const handler = (event: MessageEvent) => {
            const {data} = event;
            if (data && data.type === 'prompt_response' && data.id === id) {
                res(event.data.value);
                window.removeEventListener('message', handler);
            }
        }
        window.addEventListener('message', handler);

    });
}