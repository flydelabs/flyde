"use client";

import React, { useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

export type MonacoCodeEditorProps = {
  code: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
  filename?: string;
};

// Global flag to track Monaco configuration
let isMonacoConfigured = false;

// Configure Monaco with Flyde types
const configureMonacoTypes = async (monacoInstance: typeof monaco) => {
  if (isMonacoConfigured) {
    return;
  }
  
  try {
    // Load Flyde core types
    const coreResponse = await fetch('/types/@flyde-core.d.ts');
    if (coreResponse.ok) {
      const flydeCoreDts = await coreResponse.text();
      monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
        flydeCoreDts,
        'file:///node_modules/@types/@flyde-core.d.ts'
      );
    }
  } catch (error) {
    console.warn('Could not load Flyde core types:', error);
  }

  try {
    // Load Flyde loader types
    const loaderResponse = await fetch('/types/@flyde-loader.d.ts');
    if (loaderResponse.ok) {
      const flydeLoaderDts = await loaderResponse.text();
      monacoInstance.languages.typescript.typescriptDefaults.addExtraLib(
        flydeLoaderDts,
        'file:///node_modules/@types/@flyde-loader.d.ts'
      );
    }
  } catch (error) {
    console.warn('Could not load Flyde loader types:', error);
  }

  // Configure TypeScript compiler options
  const opts = monacoInstance.languages.typescript.typescriptDefaults.getCompilerOptions();

  monacoInstance.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...opts,
    target: monacoInstance.languages.typescript.ScriptTarget.ESNext,
    module: monacoInstance.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monacoInstance.languages.typescript.ModuleResolutionKind.NodeJs,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    noImplicitAny: false,
    strictNullChecks: false,
  });

  // Set diagnostic options
  monacoInstance.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
    noSuggestionDiagnostics: true,
  });

  isMonacoConfigured = true;
};

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  code,
  language = 'typescript',
  onChange,
  readOnly = true,
  className = '',
  filename = 'untitled.ts'
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount = useCallback(async (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor;
    
    // Configure Monaco types when editor mounts
    await configureMonacoTypes(monacoInstance);
    
    // Create a model with the filename as URI for proper TypeScript resolution
    const uri = monacoInstance.Uri.file(filename);
    const model = monacoInstance.editor.createModel(code, language, uri);
    editor.setModel(model);
    
    // Clean up previous models to prevent memory leaks
    return () => {
      model.dispose();
    };
  }, [filename, language, code]);

  const handleChange = useCallback((value: string | undefined) => {
    if (onChange && value !== undefined) {
      onChange(value);
    }
  }, [onChange]);

  return (
    <div className={`h-full w-full ${className}`}>
      <Editor
        value={code}
        language={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        onChange={handleChange}
        options={{
          readOnly,
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
        }}
      />
    </div>
  );
};