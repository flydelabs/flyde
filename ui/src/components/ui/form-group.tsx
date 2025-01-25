import * as React from "react";
import { Label } from "./label";
import { cn } from "../../lib/utils";

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  inline?: boolean;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, label, inline, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          inline ? "flex-row items-center gap-2" : "flex-col gap-1.5",
          className
        )}
        {...props}
      >
        {label && <Label>{label}</Label>}
        {children}
      </div>
    );
  }
);
FormGroup.displayName = "FormGroup";

export { FormGroup };
