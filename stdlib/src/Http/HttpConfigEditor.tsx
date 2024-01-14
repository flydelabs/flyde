import React, { useEffect, useMemo } from "react";
import { Divider, FormGroup, HTMLSelect, InputGroup } from "@blueprintjs/core";

import type { HttpConfig } from "./Http.flyde";
import { SimpleJsonEditor } from "../lib/SimpleJsonEditor";
import { MacroEditorComp } from "../lib/MacroEditorComp";

const HttpConfigEditor: MacroEditorComp<HttpConfig> = function HttpConfigEditor(
  props
) {
  const { value, onChange } = props;

  useEffect(() => {
    if (value.method.mode === "static" && value.method.value === "GET") {
      onChange({ ...value, data: { mode: "static", value: {} } });
    }
  }, [value.method]);

  const maybeDataEditor = useMemo(() => {
    if (value.method.mode === "static" && value.method.value === "GET") {
      return null;
    }

    return (
      <>
        <FormGroup label="Data Mode:" inline>
          <HTMLSelect
            value={value.data.mode}
            onChange={(e) =>
              onChange({
                ...value,
                data: {
                  mode: e.target.value as any,
                  value: e.target.value === "static" ? {} : undefined,
                },
              })
            }
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (via input)</option>
          </HTMLSelect>
        </FormGroup>
        {value.data?.mode === "static" && (
          <SimpleJsonEditor
            label="Data:"
            value={value.data.value}
            onChange={(data) =>
              onChange({ ...value, data: { mode: "static", value: data } })
            }
          />
        )}
        <Divider />
      </>
    );
  }, [value, onChange]);

  const headersEditor = useMemo(() => {
    return (
      <>
        <FormGroup label="Headers Mode:" inline>
          <HTMLSelect
            value={value.headers.mode}
            onChange={(e) =>
              onChange({
                ...value,
                headers: {
                  mode: e.target.value as any,
                  value: e.target.value === "static" ? {} : undefined,
                },
              })
            }
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (via input)</option>
          </HTMLSelect>
        </FormGroup>
        {value.headers.mode === "static" && (
          <SimpleJsonEditor
            label="Headers:"
            value={value.headers?.value}
            onChange={(data) =>
              onChange({ ...value, headers: { mode: "static", value: data } })
            }
          />
        )}
        <Divider />
      </>
    );
  }, [value, onChange]);

  const paramsEditor = useMemo(() => {
    return (
      <>
        <FormGroup label="Query params mode:" inline>
          <HTMLSelect
            value={value.params.mode}
            onChange={(e) =>
              onChange({
                ...value,
                params: {
                  mode: e.target.value as any,
                  value: e.target.value === "static" ? {} : undefined,
                },
              })
            }
          >
            <option value="static">Static</option>
            <option value="dynamic">Dynamic (via input)</option>
          </HTMLSelect>
        </FormGroup>
        {value.params.mode === "static" && (
          <SimpleJsonEditor
            label="Params:"
            value={value.params.value}
            onChange={(data) =>
              onChange({ ...value, params: { mode: "static", value: data } })
            }
          />
        )}
        <Divider />
      </>
    );
  }, [value, onChange]);

  return (
    <>
      <FormGroup label="URL Mode:" inline>
        <HTMLSelect
          value={value.url.mode}
          onChange={(e) =>
            onChange({ ...value, url: { mode: e.target.value as any } })
          }
        >
          <option value="static">Static</option>
          <option value="dynamic">Dynamic (via input)</option>
        </HTMLSelect>
      </FormGroup>
      {value.url.mode === "static" && (
        <FormGroup label="URL:">
          <InputGroup
            value={value.url.value}
            fill
            onChange={(e) =>
              onChange({
                ...value,
                url: { mode: "static", value: e.target.value },
              })
            }
          />
        </FormGroup>
      )}
      <Divider />
      <FormGroup label="Method Mode:" inline>
        <HTMLSelect
          value={value.method.mode}
          onChange={(e) =>
            onChange({
              ...value,
              method: {
                mode: e.target.value as any,
                value: e.target.value === "static" ? "GET" : undefined,
              },
            })
          }
        >
          <option value="static">Static</option>
          <option value="dynamic">Dynamic (via input)</option>
        </HTMLSelect>
      </FormGroup>
      {value.method.mode === "static" && (
        <FormGroup label="Method:">
          <HTMLSelect
            value={value.method.value}
            onChange={(e) =>
              onChange({
                ...value,
                method: { mode: "static", value: e.target.value as any },
              })
            }
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </HTMLSelect>
        </FormGroup>
      )}
      <Divider />
      {maybeDataEditor}
      {headersEditor}
      {paramsEditor}
    </>
  );
};

export default HttpConfigEditor;
