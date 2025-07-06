import * as React from "react";
import { Label } from "./label";
import { cn } from "../../lib/utils";
import { AiGenerate } from "../../ai/ai-generate";

export interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  inline?: boolean;
  aiGenerate?: {
    prompt: string;
    placeholder?: string;
    onComplete: (generatedText: string) => void;
    jsonMode?: boolean;
    nodeId: string;
    insId?: string;
  };
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, children, label, inline, aiGenerate, ...props }, ref) => {
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
        <div className="inline-flex items-center w-full justify-between">
          {label && <Label>{label}</Label>}
          {aiGenerate && (
            <AiGenerate
              {...aiGenerate}
            />
          )}
        </div>
        {children}
      </div>
    );
  }
);
FormGroup.displayName = "FormGroup";

export { FormGroup };
