"use client";

import useSize from "@react-hook/size";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Editor, useMonaco } from "@monaco-editor/react";
import { configureMonaco } from "@/lib/configureMonaco";

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ onChange, value }: CodeEditorProps) {
  const target = useRef(null);
  const [height] = useSize(target);

  const _onChange = useCallback(
    (value: string | undefined) => {
      onChange(value ?? "");
    },
    [onChange]
  );

  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      configureMonaco(monaco);
    }
  }, [monaco]);

  const options = useMemo(() => {
    return {
      minimap: { enabled: false },
      scrollbar: { verticalScrollbarSize: 3 },
    };
  }, []);

  return (
    <div className=" h-full">
      <Editor
        height="100%"
        className="pt-2"
        defaultLanguage="typescript"
        defaultValue={value}
        onChange={_onChange}
        options={options}
      />
    </div>
  );
}
