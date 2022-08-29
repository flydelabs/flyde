import React from "react";
import ReactDOM from "react-dom";
import ReactTooltip from "react-tooltip";

// Create root level element for react-tooltips
const domNode = document.createElement('div');
document.body.appendChild(domNode);

// Wrapper component to portal react-tooltips
function BodyPortal ({ children }: any) {
  return ReactDOM.createPortal(
    children,
    domNode
  );
}

// Custom tooltip wrapper to ensure all tooltips get rendered into the portal
export const CustomReactTooltip: React.FC<ReactTooltip.Props> = (props) => {
  return (
    <BodyPortal>
      <ReactTooltip
        {...props}
      />
    </BodyPortal>
  );
}

export default CustomReactTooltip;