import React, { useState, useEffect } from "react";
import { MacroEditorComp } from "@flyde/core";
import { CommentConfig } from "./Comment.flyde";

export const CommentEditor: MacroEditorComp<CommentConfig> = ({
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
        placeholder="Enter your comment here"
        rows={10}
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default CommentEditor;
