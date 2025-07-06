import React, { useState, useEffect } from "react";
import { ConfigurableEditorComp } from "@flyde/core";
import { NoteConfig } from "./Note.flyde";
import { Alert, AlertDescription, Textarea } from "@flyde/editor";

export const NoteEditor: ConfigurableEditorComp<NoteConfig> = ({
  value,
  onChange,
}) => {
  const [content, setContent] = useState(value.content);

  useEffect(() => {
    onChange({ content });
  }, [content, onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Enter your note here (A subset of Markdown is supported)"
        rows={10}
        style={{ width: "100%", padding: "8px 6px", minHeight: "200px" }}
      />
      <Alert>
        <AlertDescription>A subset of markdown is supported</AlertDescription>
      </Alert>
    </div>
  );
};

export default NoteEditor;
