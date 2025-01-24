import { Label, Textarea } from "@flyde/ui";
import React, { useCallback } from "react";

type JsonValue =
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
}) {
  const [tempDataValue, setTempDataValue] = React.useState<string>(
    JSON.stringify(props.value, null, 2)
  );

  const [dataParseError, setDataParseError] = React.useState<string>();

  const onValueChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTempDataValue(e.target.value);
      try {
        const data = JSON.parse(e.target.value);
        setDataParseError(undefined);
        props.onChange(data);
      } catch (e) {
        setDataParseError(e.message);
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
        style={{ width: "100%", minHeight: "100px" }}
      />
      {dataParseError && (
        <div
          style={{
            color: "rgb(220, 38, 38)",
            fontSize: "14px",
            marginTop: "4px",
          }}
        >
          {dataParseError}
        </div>
      )}
    </div>
  );
}
