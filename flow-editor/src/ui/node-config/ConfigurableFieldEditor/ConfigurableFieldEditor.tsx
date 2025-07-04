
import {
  ConfigurableValue,
  ConfigurableFieldDefinition,
  PartialEditorPorts,
} from "@flyde/core";
import { ConfigurableValueBaseEditor } from "./ConfigurableValueBaseEditor";
import { useCallback, useState, useEffect } from "react";
import { convertValue } from "./convertValues";
import {
  DropdownMenu,
  DropdownMenuTrigger, Button, Settings, DropdownMenuContent, DropdownMenuItem, Check, AiGenerate, Expand, TooltipProvider, Tooltip, TooltipTrigger, Info, TooltipContent, Dialog, DialogTrigger, DialogContent
} from "../..";

function FieldContent({
  config,
  value,
  onChange,
  handleDialogToggle,
  isExpanded,
  onTypeChange,
  nodeId,
  insId,
}: {
  config: ConfigurableFieldDefinition;
  value: ConfigurableValue;
  onChange: (value: ConfigurableValue) => void;
  handleDialogToggle?: () => void;
  isExpanded?: boolean;
  onTypeChange?: (type: ConfigurableValue["type"]) => void;
  nodeId: string;
  insId?: string;
}) {
  const shouldShowExpand =
    !isExpanded &&
    (value.type === "json" ||
      (value.type === "string" && config.type === "longtext"));

  const typeOptions: ConfigurableValue["type"][] = [
    "dynamic",
    "number",
    "boolean",
    "json",
    "string",
  ];

  return (
    <div className="mb-1 font-medium flex items-center gap-2 justify-between">
      <div className="flex items-center gap-2">
        {config.label}:
      </div>
      <div className="flex items-center gap-2">
        {config.typeConfigurable !== false && onTypeChange && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span className="capitalize">{value.type}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="link" size="xs" className="h-4 p-0 text-xs">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {typeOptions.map((type) => (
                  <DropdownMenuItem key={type} onClick={() => onTypeChange(type)}>
                    <div className="flex items-center justify-between w-full">
                      <span className="capitalize">{type}</span>
                      {value.type === type && <Check className="h-4 w-4 ml-2" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {config.aiCompletion && (value.type === "json" || value.type === "string") && (
          <div>
            <AiGenerate
              prompt={config.aiCompletion.prompt}
              placeholder={config.aiCompletion.placeholder}
              jsonMode={value.type === "json"}
              currentValue={value.value}
              nodeId={nodeId}
              insId={insId}

              onComplete={(text: string) => {
                try {
                  const parsed = JSON.parse(text);
                  onChange({
                    ...value,
                    value: parsed,
                  } as ConfigurableValue);
                } catch {
                  onChange({ ...value, value: text } as ConfigurableValue);
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

export function ConfigurableFieldEditor(props: {
  value: ConfigurableValue;
  onChange: (value: ConfigurableValue) => void;
  config: ConfigurableFieldDefinition;
  ports: PartialEditorPorts;
  nodeId: string;
  insId?: string;
}) {
  const { config, value, onChange, ports, nodeId, insId } = props;
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
    (newType: ConfigurableValue["type"]) => {
      const newValue = convertValue(value.type, newType, value.value);
      onChange({ type: newType, value: newValue });
    },
    [value, onChange]
  );

  const handleDialogToggle = () => {
    setIsDialogOpen(!isDialogOpen);
  };

  const isTemplateSupported =
    ((value.type === "string" && config.type !== 'secret') || value.type === "json") &&
    config.templateSupport !== false

  return (
    <div className="mb-4 group">
      <FieldContent
        config={config}
        value={value}
        onChange={onChange}
        handleDialogToggle={handleDialogToggle}
        onTypeChange={changeType}
        nodeId={nodeId}
        insId={insId}
      />
      <ConfigurableValueBaseEditor
        value={value}
        onChange={onChange}
        fieldDefinition={config}
        isExpanded={false}
        rawJsonData={rawJsonData}
        onRawJsonDataChange={setRawJsonData}
        ports={ports}
      />

      <div className="mt-2 flex justify-between items-center">
        {config.description ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            {config.description}
          </div>
        ) : (
          <div></div>
        )}
        {isTemplateSupported && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="xs" className="p-0 h-4 text-xs text-gray-500">
                  Variables supported <Info className="h-3 w-3 text-gray-500 ml-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                Use &#123;&#123; &#125;&#125; to insert variables. For example &#123;&#123;myVar&#125;&#125; or &#123;&#123;myVar.someProp&#125;&#125;. Each distinct variable will be exposed as an input and can be used to receive dynamic values from other nodes.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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
            onTypeChange={isDialogOpen ? changeType : undefined}
            nodeId={nodeId}
            insId={insId}
          />
          <ConfigurableValueBaseEditor
            value={value}
            onChange={onChange}
            fieldDefinition={config}
            isExpanded={true}
            rawJsonData={rawJsonData}
            onRawJsonDataChange={setRawJsonData}
            ports={ports}
          />

          <div className="mt-2 flex justify-between items-center">
            {config.description ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                {config.description}
              </div>
            ) : (
              <div></div>
            )}
            {isTemplateSupported && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="xs" className="p-0 h-4 text-xs text-gray-500">
                      Variables supported <Info className="h-3 w-3 text-gray-500 ml-1" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Use &#123;&#123; &#125;&#125; to insert variables. For example &#123;&#123;myVar&#125;&#125; or &#123;&#123;myVar.someProp&#125;&#125;
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
