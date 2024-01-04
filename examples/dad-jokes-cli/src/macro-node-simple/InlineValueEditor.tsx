import React from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css"; //Example style, you can use another

function InlineValueEditor(props: {
  value: any;
  onChange: (val: any) => void;
}) {
  return (
    <div>
      Value:
      <Editor
        value={props.value}
        onValueChange={props.onChange}
        highlight={(code) => highlight(code, languages.js)}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12,
        }}
      />
    </div>
  );
}

export default InlineValueEditor;
