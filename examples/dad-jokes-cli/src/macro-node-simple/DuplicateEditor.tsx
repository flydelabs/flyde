import React from "react";

function DuplicateEditor(props: { value: any; onChange: (val: any) => void }) {
  return (
    <div>
      Choose Delay:
      <input
        type="number"
        min={2}
        max={10}
        value={props.value}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onChange(e.target.value);
        }}
      />
    </div>
  );
}

export default DuplicateEditor;
