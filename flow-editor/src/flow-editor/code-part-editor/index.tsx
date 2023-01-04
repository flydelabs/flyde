import { BasePart, CodePart } from "@flyde/core";
import { Callout, Code, FormGroup, MenuItem } from "@blueprintjs/core";
import React from "react";

import Editor from "@monaco-editor/react";

// ;
import { BasePartEditor } from "../base-part-editor";

export interface CodePartEditorProps {
  editMode: boolean;
  part: CodePart;
  onChange: (part: CodePart) => Promise<void> | void;
}

export const renderCreateIOOption = (
  query: string,
  active: boolean,
  handleClick: React.MouseEventHandler<HTMLElement>
) => (
  <MenuItem
    icon="add"
    text={`Create "${query}"`}
    active={active}
    onClick={handleClick}
    shouldDismissPopover={false}
  />
);

export const CodePartEditor: React.FC<CodePartEditorProps> = (props) => {
  const { part, onChange } = props;

  const onChangeFnCode = React.useCallback(
    (fnCode) => {
      onChange({ ...part, fnCode });
    },
    [part, onChange]
  );

  const onChangeCustomView = React.useCallback(
    (customViewCode) => {
      onChange({ ...part, customViewCode });
    },
    [part, onChange]
  );

  const onChangeBase = React.useCallback(
    (base: BasePart) => {
      onChange({ ...part, ...base, completionOutputs: base.completionOutputs });
    },
    [part, onChange]
  );
  return (
    <div className="code-part-editor">
      <BasePartEditor
        part={part}
        onChange={onChangeBase}
        idDisabled={props.editMode}
      />
      <FormGroup label="Code">
        <Editor
          height="200px"
          theme="vs-dark"
          defaultLanguage="javascript"
          value={part.fnCode}
          onChange={(e) => onChangeFnCode(e || "")}
        />
      </FormGroup>

      <FormGroup label="Custom View">
        <Editor
          height="100px"
          theme="vs-dark"
          defaultLanguage="ejs"
          value={part.customViewCode}
          onChange={(e) => onChangeCustomView(e || "")}
        />
        <Callout>
          Example:
          <Code>{`<% if (inputs.key) { %>
              Pick "<%- inputs.key %>"
              <% }  else { %>
                Pick
              <% } %>
              `}</Code>
        </Callout>
      </FormGroup>
    </div>
  );
};
