import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { Textarea } from "../components/ui/textarea";
import { AiIcon } from "../icons/AiIcon";
import { HotkeyIndication } from "../components/ui/hotkey-indication";
import { cn } from "../lib/utils";
import { useAiCompletion } from "./context";

interface AiGenerateProps {
  prompt: string;
  placeholder?: string;
  onComplete: (generatedText: string) => void;
  className?: string;
  jsonMode?: boolean;
  currentValue?: any;
  nodeId: string;
  insId?: string;
}

export function AiGenerate({
  prompt,
  placeholder,
  onComplete,
  className,
  jsonMode = false,
  currentValue,
  nodeId,
  insId
}: AiGenerateProps) {
  const { createCompletion, enabled } = useAiCompletion();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Give the popover time to render
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
    }
  }, [isOpen]);

  if (!enabled) {
    return null;
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      // Replace template variables in the prompt
      let processedPrompt = prompt.replace(/{{prompt}}/g, input);

      // Handle the currentValue replacement
      if (currentValue !== undefined) {
        const valueString =
          typeof currentValue === "object"
            ? JSON.stringify(currentValue, null, 2)
            : String(currentValue);
        processedPrompt = processedPrompt.replace(/{{value}}/g, valueString);
      }

      const result = await createCompletion({
        prompt: processedPrompt,
        jsonMode,
        nodeId,
        insId: insId || ""

      });
      onComplete(result);
      setInput("");
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          className={cn("gap-2", className)}
          disabled={isGenerating}
        >
          <AiIcon />
          Generate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-foreground" sideOffset={5}>
        <div className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && input) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <div className="flex justify-end items-center gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!input || isGenerating}
              className="gap-2"
              variant="outline"
              size="xs"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  Create <HotkeyIndication hotkey="enter" />
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
