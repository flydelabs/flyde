"use client";

import React, { useState } from 'react';
import { FileText, FileCode, ChevronDown, Plus, FolderOpen, Edit2 } from 'lucide-react';

export interface PlaygroundFile {
  name: string;
  type: 'flyde' | 'ts';
  content: string;
  modified?: boolean;
}

export interface PlaygroundSidebarProps {
  files: PlaygroundFile[];
  activeFile: string | null;
  onFileSelect: (fileName: string) => void;
  onNewFile: (file: PlaygroundFile) => void;
  onDeleteFile: (fileName: string) => void;
  onRenameFile: (oldName: string, newName: string) => void;
}

const fileTemplates = {
  flyde: {
    'Blank': `imports: {}
node:
  instances: []
  connections: []
  id: MyFlow
  inputs: {}
  outputs: {}
  inputsPosition: {}
  outputsPosition: {}
  completionOutputs: []`,
    'Simple Example': `imports: {}
node:
  instances:
    - pos:
        x: 100
        y: -150
      id: InlineValue-lt28i55w
      inputConfig: {}
      nodeId: InlineValue
      config:
        value:
          type: string
          value: Hello, {{name}}!
      type: code
      source:
        type: package
        data: "@flyde/nodes"
  connections:
    - from:
        insId: __this
        pinId: name
      to:
        insId: InlineValue-lt28i55w
        pinId: name
    - from:
        insId: InlineValue-lt28i55w
        pinId: value
      to:
        insId: __this
        pinId: greeting
  id: HelloWorld
  inputs:
    name:
      mode: required
  outputs:
    greeting:
      delayed: false
  inputsPosition:
    name:
      x: -217
      y: -169
  outputsPosition:
    greeting:
      x: 363
      y: -169
  completionOutputs: []`,
    'Complex Example': `imports: {}
node:
  instances:
    - pos:
        x: 100
        y: -150
      id: Conditional-k3qp7t6n
      inputConfig: {}
      nodeId: Conditional
      config:
        condition:
          type: string
          value: "{{input}} === 'test'"
      type: code
      source:
        type: package
        data: "@flyde/nodes"
    - pos:
        x: 300
        y: -100
      id: InlineValue-1r8x9m2k
      inputConfig: {}
      nodeId: InlineValue
      config:
        value:
          type: string
          value: Success!
      type: code
      source:
        type: package
        data: "@flyde/nodes"
    - pos:
        x: 300
        y: -200
      id: InlineValue-9k2m1r8x
      inputConfig: {}
      nodeId: InlineValue
      config:
        value:
          type: string
          value: Failed!
      type: code
      source:
        type: package
        data: "@flyde/nodes"
  connections:
    - from:
        insId: __this
        pinId: input
      to:
        insId: Conditional-k3qp7t6n
        pinId: input
    - from:
        insId: Conditional-k3qp7t6n
        pinId: true
      to:
        insId: InlineValue-1r8x9m2k
        pinId: trigger
    - from:
        insId: Conditional-k3qp7t6n
        pinId: false
      to:
        insId: InlineValue-9k2m1r8x
        pinId: trigger
    - from:
        insId: InlineValue-1r8x9m2k
        pinId: value
      to:
        insId: __this
        pinId: result
    - from:
        insId: InlineValue-9k2m1r8x
        pinId: value
      to:
        insId: __this
        pinId: result
  id: ConditionalFlow
  inputs:
    input:
      mode: required
  outputs:
    result:
      delayed: false
  inputsPosition:
    input:
      x: -217
      y: -150
  outputsPosition:
    result:
      x: 500
      y: -150
  completionOutputs: []`
  },
  ts: {
    'Simple Value Emitter': `import { CodeNode } from "@flyde/core";

export const MyNode: CodeNode = {
  id: "MyNode",
  description: "Emits a simple value",
  inputs: {
    trigger: { 
      description: "Trigger to emit the value"
    }
  },
  outputs: {
    value: {
      description: "The emitted value"
    }
  },
  run: (inputs, outputs) => {
    const { value } = outputs;
    value.next("Hello World!");
  },
};`,
    'Add Two Numbers': `import { CodeNode } from "@flyde/core";

export const MyNode: CodeNode = {
  id: "MyNode",
  description: "Adds two numbers together",
  inputs: {
    a: { 
      description: "First number",
      mode: "required"
    },
    b: {
      description: "Second number", 
      mode: "required"
    }
  },
  outputs: {
    sum: {
      description: "The sum of a and b"
    }
  },
  run: (inputs, outputs) => {
    const { a, b } = inputs;
    const { sum } = outputs;
    
    const result = Number(a) + Number(b);
    sum.next(result);
  },
};`,
    'Debounce': `import { CodeNode } from "@flyde/core";

export const MyNode: CodeNode = {
  id: "MyNode",
  description: "Debounces input values with a configurable delay",
  inputs: {
    value: {
      description: "Value to debounce",
      mode: "reactive",
    },
    delayMs: {
      description: "Debounce delay in milliseconds",
      defaultValue: 420
    },
  },
  outputs: {
    debouncedValue: { 
      description: "Debounced value" 
    },
  },
  completionOutputs: ["debouncedValue"],
  run: (inputs, outputs, adv) => {
    const { value, delayMs } = inputs;
    const { debouncedValue } = outputs;

    const timer = adv.state.get("timer");
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      debouncedValue.next(value);
    }, delayMs || 420);

    adv.state.set("timer", newTimer);

    adv.onCleanup(() => {
      const currentTimer = adv.state.get("timer");
      if (currentTimer) {
        clearTimeout(currentTimer);
      }
    });
  },
};`,
    'Value Emitter': `import { CodeNode } from "@flyde/core";

export const MyNode: CodeNode = {
  id: "MyNode",
  description: "Emits a configured value when triggered",
  inputs: {
    trigger: { 
      description: "Trigger to emit the value"
    },
    value: {
      description: "Value to emit",
      defaultValue: "Default Value"
    }
  },
  outputs: {
    output: {
      description: "The emitted value"
    }
  },
  run: (inputs, outputs) => {
    const { value } = inputs;
    const { output } = outputs;
    
    output.next(value);
  },
};`
  }
};

const examples = [
  { id: 'blog-generator', name: 'Blog Generator' },
  { id: 'hello-world', name: 'Hello World' }
];

export const PlaygroundSidebar: React.FC<PlaygroundSidebarProps> = ({
  files,
  activeFile,
  onFileSelect,
  onNewFile,
  onDeleteFile,
  onRenameFile
}) => {
  const [showTsMenu, setShowTsMenu] = useState(false);
  const [showFlydeMenu, setShowFlydeMenu] = useState(false);

  const toPascalCase = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/^\d/, ''); // Remove leading numbers
  };

  const handleNewFile = (type: 'flyde' | 'ts', templateName: string) => {
    const templates = fileTemplates[type];
    const template = templates[templateName as keyof typeof templates] as string;
    const extension = type === 'flyde' ? '.flyde' : '.flyde.ts';

    let fileName: string = '';
    let content: string = template;

    if (type === 'ts') {
      const name = prompt('Enter a name for your node:');
      if (!name || name.trim() === '') return;

      const cleanName = toPascalCase(name.trim());
      if (cleanName === '') {
        alert('Please enter a valid node name.');
        return;
      }

      fileName = `${cleanName}.flyde.ts`;

      // Replace the template placeholders with the actual name
      content = template
        .replace(/MyNode/g, cleanName)
        .replace(/export const MyNode/g, `export const ${cleanName}`);
    } else {
      // Find unique filename for flyde files
      let counter = 1;
      fileName = `new-file${extension}`;
      while (files.some(f => f.name === fileName)) {
        fileName = `new-file-${counter}${extension}`;
        counter++;
      }
    }

    onNewFile({
      name: fileName,
      type,
      content
    });

    setShowTsMenu(false);
    setShowFlydeMenu(false);
  };

  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileName === 'index.ts') {
      alert('Cannot delete index.ts - it\'s required for the playground to function.');
      return;
    }
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      onDeleteFile(fileName);
    }
  };

  const handleRenameFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileName === 'index.ts') {
      alert('Cannot rename index.ts - it\'s required for the playground to function.');
      return;
    }
    const newName = prompt('Enter new file name:', fileName);
    if (newName && newName.trim() !== '' && newName !== fileName) {
      const trimmedName = newName.trim();
      if (files.some(f => f.name === trimmedName)) {
        alert('A file with that name already exists.');
        return;
      }
      onRenameFile(fileName, trimmedName);
    }
  };

  return (
    <div className="w-64 bg-[#252526] text-gray-300 flex flex-col h-full">
      {/* Files Header */}
      <div className="flex items-center px-3 py-2 border-b border-[#3c3c3c] flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Files</span>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {files.map(file => (
          <div
            key={file.name}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#2a2d2e] group ${activeFile === file.name ? 'bg-[#37373d] text-white' : ''
              }`}
          >
            <button
              onClick={() => onFileSelect(file.name)}
              className="flex items-center gap-2 flex-1 text-left"
            >
              {file.type === 'flyde' ? (
                <FileText className="w-4 h-4 text-blue-400" />
              ) : (
                <FileCode className="w-4 h-4 text-yellow-400" />
              )}
              <span>{file.name}</span>
            </button>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {file.name !== 'index.ts' && (
                <button
                  onClick={(e) => handleRenameFile(file.name, e)}
                  className="p-0.5 hover:bg-blue-600 rounded text-xs"
                  title="Rename file"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={(e) => handleDeleteFile(file.name, e)}
                className={`p-0.5 hover:bg-red-600 rounded text-xs ${file.name === 'index.ts' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title={file.name === 'index.ts' ? 'Cannot delete index.ts' : 'Delete file'}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New File Buttons */}
      <div className="p-2 border-t border-[#3c3c3c] flex-shrink-0 space-y-1">
        <div className="relative">
          {/* <button
            onClick={() => setShowFlydeMenu(!showFlydeMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-blue-400 hover:bg-[#2a2d2e] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>New Visual Flow</span>
          </button> */}

          {showFlydeMenu && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#3c3c3c] border border-[#464647] rounded shadow-lg z-10">
              <div className="p-0.5">
                {Object.keys(fileTemplates.flyde).map(template => (
                  <button
                    key={template}
                    onClick={() => handleNewFile('flyde', template)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-[#094771] rounded"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTsMenu(!showTsMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-yellow-400 hover:bg-[#2a2d2e] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <FileCode className="w-3.5 h-3.5 text-yellow-400" />
            <span>New Code Node</span>
          </button>

          {showTsMenu && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#3c3c3c] border border-[#464647] rounded shadow-lg z-10">
              <div className="p-0.5">
                {Object.keys(fileTemplates.ts).map(template => (
                  <button
                    key={template}
                    onClick={() => handleNewFile('ts', template)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-[#094771] rounded"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};