import React, { useState, useEffect } from "react";
import { MacroEditorComp } from "@flyde/core";
import { NoteConfig } from "./Note.flyde";
import { Callout } from "@blueprintjs/core";

export const NoteEditor: MacroEditorComp<NoteConfig> = ({
  value,
  onChange,
}) => {
  const [content, setContent] = useState(value.content);

  useEffect(() => {
    onChange({ content });
  }, [content, onChange]);

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your note here (A subset of Markdown is supported)"
        rows={10}
        style={{ width: "100%", padding: "8px 6px" }}
      />
      <Callout intent="primary" icon={null}>
        A subset of markdown is supported
      </Callout>
    </div>
  );
};

export default NoteEditor;
