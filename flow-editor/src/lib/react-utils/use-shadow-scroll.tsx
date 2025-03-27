import { useState } from "react";

export function useScrollWithShadow(darkMode: boolean) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  const onScrollHandler = (event: any) => {
    setScrollTop(Math.floor(event.target.scrollTop));
    setScrollHeight(Math.floor(event.target.scrollHeight));
    setClientHeight(Math.floor(event.target.clientHeight));
  };

  const color = darkMode ? "rgb(50 50 50 / 1)" : "rgb(235 235 235 / 1)";

  function getBoxShadow() {
    const isBottom = clientHeight === scrollHeight - scrollTop;
    const isTop = scrollTop === 0;
    const isBetween = scrollTop > 0 && clientHeight < scrollHeight - scrollTop;
    const isScrollable = scrollHeight > clientHeight;

    let boxShadow = "none";
    const top = `inset 0 8px 5px -5px ${color}`;
    const bottom = `inset 0 -8px 5px -5px ${color}`;

    if (!isScrollable) {
      return boxShadow;
    }

    if (isTop) {
      boxShadow = bottom;
    } else if (isBetween) {
      boxShadow = `${top}, ${bottom}`;
    } else if (isBottom) {
      boxShadow = top;
    }
    return boxShadow;
  }

  return { boxShadow: getBoxShadow(), onScrollHandler };
}
