import { FormGroup, TextArea } from "@blueprintjs/core";
import React, { useCallback } from "react";

export function SimpleJsonEditor(props: {
  value: any;
  onChange: (value: any) => void;
  label: string;
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
    <FormGroup
      label={props.label}
      intent={dataParseError ? "danger" : undefined}
      helperText={dataParseError}
    >
      <TextArea value={tempDataValue} fill onChange={onValueChange} />
    </FormGroup>
  );
}
