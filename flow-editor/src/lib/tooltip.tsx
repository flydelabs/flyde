import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { TooltipProps, default as ReactTooltip} from "react-tooltip";

// Wrapper component to portal react-tooltips
function BodyPortal ({ children, domNode }: any) {
  return ReactDOM.createPortal(
    children,
    domNode
  );
}

// Custom tooltip wrapper to ensure all tooltips get rendered into the portal
export const CustomReactTooltip: React.FC<TooltipProps> = (props) => {

  const domNode = useRef<Element>();

  useEffect(() => {
    domNode.current = document.createElement('div');
    document.body.appendChild(domNode.current);
  }, [])
  return (domNode.current ? <BodyPortal domNode={domNode.current}>
      <ReactTooltip
        {...props}
      />
    </BodyPortal> : null
  );
}

export default CustomReactTooltip;