import { zoomLevel } from "zoom-level";


const isRetinaDisplay = () => {
    if (window.matchMedia) {
        const mq = window.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)");
        return (mq && mq.matches || (window.devicePixelRatio > 1)); 
    }
}

export const calcZoom = () => {
    const zl = zoomLevel();
    return isRetinaDisplay() ? zl / 2 : zl;
}