/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef } from 'react';

// Monaco Editor types (will be loaded dynamically)
declare global {
  interface Window {
    monaco: any;
  }
}

export type MonacoCodeEditorProps = {
  code: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
};

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  code,
  language = 'typescript',
  onChange,
  readOnly = true,
  className = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<any>(null);

  useEffect(() => {
    const loadMonaco = async () => {
      // Load Monaco Editor dynamically
      if (!window.monaco) {
        // Add Monaco Editor CDN
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://unpkg.com/monaco-editor@0.44.0/min/vs/loader.js';
        document.head.appendChild(loaderScript);

        await new Promise((resolve) => {
          loaderScript.onload = resolve;
        });

        // Configure Monaco
        (window as any).require.config({
          paths: { 
            vs: 'https://unpkg.com/monaco-editor@0.44.0/min/vs' 
          }
        });

        await new Promise((resolve) => {
          (window as any).require(['vs/editor/editor.main'], resolve);
        });
      }

      if (editorRef.current && window.monaco && !monacoEditorRef.current) {
        // Create the editor
        monacoEditorRef.current = window.monaco.editor.create(editorRef.current, {
          value: code,
          language: language,
          theme: 'vs-dark',
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: 'SF Mono, Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          automaticLayout: true,
          folding: true,
          wordWrap: 'on',
          contextmenu: false,
          selectOnLineNumbers: true,
          roundedSelection: false,
          smoothScrolling: true,
          cursorStyle: 'line',
          cursorBlinking: 'blink',
          renderLineHighlight: 'gutter',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          }
        });

        // Handle changes
        if (onChange && !readOnly) {
          monacoEditorRef.current.onDidChangeModelContent(() => {
            const value = monacoEditorRef.current.getValue();
            onChange(value);
          });
        }
      }
    };

    loadMonaco().catch(console.error);

    return () => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
        monacoEditorRef.current = null;
      }
    };
  }, []);

  // Update code when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && code !== monacoEditorRef.current.getValue()) {
      monacoEditorRef.current.setValue(code);
    }
  }, [code]);

  return (
    <div className={`h-full w-full ${className}`}>
      <div 
        ref={editorRef} 
        className="h-full w-full"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};