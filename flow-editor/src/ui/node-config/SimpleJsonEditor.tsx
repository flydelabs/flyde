import React, { useCallback } from "react";
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function SimpleJsonEditor(props: {
  value: JsonValue;
  onChange: (value: JsonValue) => void;
  label?: string;
  isExpanded?: boolean;
  rawData?: string;
  onChangeRaw?: (rawData: string) => void;
}) {
  const [tempDataValue, setTempDataValue] = React.useState<string>(
    props.rawData || JSON.stringify(props.value, null, 2)
  );

  React.useEffect(() => {
    if (props.rawData !== undefined) {
      setTempDataValue(props.rawData);
    }
  }, [props.rawData]);

  const [dataParseError, setDataParseError] = React.useState<string>();

  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newRawValue = e.target.value;
      setTempDataValue(newRawValue);

      if (props.onChangeRaw) {
        props.onChangeRaw(newRawValue);
      }

      try {
        const data = JSON.parse(newRawValue);
        setDataParseError(undefined);
        props.onChange(data);
      } catch (e) {
        setDataParseError((e as Error).message);
      }
    },
    [props]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {props.label && <Label>{props.label}</Label>}
      <Textarea
        value={tempDataValue}
        onChange={onValueChange}
        style={{
          minWidth: props.isExpanded ? "65vw" : "100%",
          height: props.isExpanded ? "65vh" : undefined,
        }}
      />
      {dataParseError && (
        <div className="text-red-500 text-sm mt-1">{dataParseError}</div>
      )}
    </div>
  );
}
