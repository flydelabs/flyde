import { isDefined } from "@flyde/core";
import ReactJsonView from "react-json-view";

export const AnalyticsValueRenderer: React.FC<{ val: any }> = ({ val }) => {
    // const [isOpen, setIsOpen] = React.useState(false);
  
    // const toggle = React.useCallback(() => setIsOpen(o => !o), [setIsOpen]);
  
    try {
      const obj = JSON.parse(val);
  
      const obj2 = typeof obj === "object" ? obj : { value: obj };
  
  
      const isJsx = obj && [obj.type, obj.key, obj.props, obj.ref].every(isDefined);
  
      const obj3 = isJsx ? {jsxValue: obj}  : obj2;
  
      return (
        <ReactJsonView
          src={obj3}
          name={false}
          collapseStringsAfterLength={50}
          groupArraysAfterLength={5}
          collapsed={isJsx}
        />
      );
    } catch (e) {
      return (
        <ReactJsonView
          src={{value: val}}
          name={false}
          collapseStringsAfterLength={50}
          groupArraysAfterLength={5}
        />
      );
    }
  };
  