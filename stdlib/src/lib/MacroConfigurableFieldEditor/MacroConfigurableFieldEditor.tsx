import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Settings,
  AiGenerate,
  Dialog,
  DialogTrigger,
  DialogContent,
  Expand,
} from "@flyde/ui";
import {
  MacroConfigurableValue,
  MacroEditorFieldDefinition,
} from "@flyde/core";
import { MacroConfigurableValueBaseEditor } from "./MacroConfigurableValueBaseEditor";
import { useCallback, useMemo, useState, useEffect } from "react";
import { convertValue } from "./convertValues";
import React from "react";

function FieldContent({
  config,
  value,
  onChange,
  handleDialogToggle,
  isExpanded,
}: {
  config: MacroEditorFieldDefinition;
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  handleDialogToggle?: () => void;
  isExpanded?: boolean;
}) {
  const shouldShowExpand =
    !isExpanded &&
    (value.type === "json" ||
      (value.type === "string" && config.type === "longtext"));

  return (
    <div className="mb-1 font-medium flex items-center gap-2 justify-between">
      {config.label}:
      <div className="flex items-center gap-2">
        {config.aiCompletion && (
          <div
            className={
              isExpanded
                ? ""
                : "opacity-0 group-hover:opacity-100 transition-opacity"
            }
          >
            <AiGenerate
              prompt={config.aiCompletion.prompt}
              placeholder={config.aiCompletion.placeholder}
              jsonMode={config.aiCompletion.jsonMode}
              currentValue={value.value}
              onComplete={(text: string) => {
                try {
                  const parsed = JSON.parse(text);
                  onChange({
                    ...value,
                    value: parsed,
                  } as MacroConfigurableValue);
                } catch {
                  onChange({ ...value, value: text } as MacroConfigurableValue);
                }
              }}
            />
          </div>
        )}
        {shouldShowExpand && handleDialogToggle && (
          <Button variant="outline" size="xs" onClick={handleDialogToggle}>
            <Expand size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}

export function MacroConfigurableFieldEditor(props: {
  value: MacroConfigurableValue;
  onChange: (value: MacroConfigurableValue) => void;
  config: MacroEditorFieldDefinition;
  prompt: (message: string) => Promise<string>;
}) {
  const { config, value, onChange, prompt } = props;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rawJsonData, setRawJsonData] = useState<string>(
    value.type === "json" ? JSON.stringify(value.value, null, 2) : ""
  );

  useEffect(() => {
    if (value.type === "json" && typeof value.value !== "string") {
      setRawJsonData(JSON.stringify(value.value, null, 2));
    }
  }, [value]);

  const changeType = useCallback(
    (newType: MacroConfigurableValue["type"]) => {
      const newValue = convertValue(value.type, newType, value.value);
      onChange({ type: newType, value: newValue });
    },
    [value, onChange]
  );

  const handleDialogToggle = () => {
    setIsDialogOpen(!isDialogOpen);
  };

  const helperText = useMemo(() => {
    const isTemplateSupported =
      (value.type === "string" || value.type === "json") &&
      config.templateSupport !== false;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "4px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <span>
          {isTemplateSupported
            ? "Use {{ }} to insert variables. For example {{myVar}}"
            : ""}
        </span>
        {!isDialogOpen && config.typeConfigurable !== false ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Settings className="h-4 w-4 mr-2" />
                Change type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeType("dynamic")}>
                Dynamic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("number")}>
                Number
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("boolean")}>
                Boolean
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("json")}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeType("string")}>
                String
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    );
  }, [changeType, config, value.type, isDialogOpen]);

  return (
    <div className="mb-4 group">
      <FieldContent
        config={config}
        value={value}
        onChange={onChange}
        handleDialogToggle={handleDialogToggle}
      />
      <MacroConfigurableValueBaseEditor
        value={value}
        onChange={onChange}
        fieldDefinition={config}
        prompt={prompt}
        isExpanded={false}
        rawJsonData={rawJsonData}
        onRawJsonDataChange={setRawJsonData}
      />

      {config.description && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          {config.description}
        </div>
      )}
      {helperText}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
        <DialogTrigger asChild>
          <button className="hidden">Open Dialog</button>
        </DialogTrigger>
        <DialogContent
          className="max-w-screen-lg w-[90vw] !h-[90vh] !w-[90vw]"
          noCloseButton
          noInteractOutside
        >
          <FieldContent
            config={config}
            value={value}
            onChange={onChange}
            isExpanded={true}
          />
          <MacroConfigurableValueBaseEditor
            value={value}
            onChange={onChange}
            fieldDefinition={config}
            prompt={prompt}
            isExpanded={true}
            rawJsonData={rawJsonData}
            onRawJsonDataChange={setRawJsonData}
          />

          {config.description && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
              {config.description}
            </div>
          )}
          {helperText}

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
