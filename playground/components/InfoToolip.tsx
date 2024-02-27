import { useMemo } from "react";
import { Tooltip } from "react-tooltip";

export function InfoTooltip({
  content,
  small,
  className,
}: {
  content: string;
  small?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-block align-middle mb-1 ml-1 ${className}`}
      data-tooltip-id={"main-tooltip"}
      data-tooltip-content={content}
    >
      <svg
        id="info-circle"
        data-name="Layer 1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className={`fill-current ${
          small ? "h-2 w-2" : "h-4 w-4"
        } text-slate-800`}
      >
        <path
          fill="currentColor"
          d="M12,2A10,10,0,1,0,22,12,10.01114,10.01114,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8.00917,8.00917,0,0,1,12,20Zm0-8.5a1,1,0,0,0-1,1v3a1,1,0,0,0,2,0v-3A1,1,0,0,0,12,11.5Zm0-4a1.25,1.25,0,1,0,1.25,1.25A1.25,1.25,0,0,0,12,7.5Z"
        ></path>
      </svg>
    </div>
  );
}
