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
  outputs: {}`,
    'Simple Example': `imports: {}
node:
  instances:
    - pos:
        x: 100
        y: -150
      id: InlineValue-1
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
        insId: InlineValue-1
        pinId: name
    - from:
        insId: InlineValue-1
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
      delayed: false`,
    'Complex Example': `imports: {}
node:
  instances:
    - pos:
        x: 100
        y: -150
      id: If-1
      inputConfig: {}
      nodeId: If
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
      id: InlineValue-1
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
      id: InlineValue-2
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
        insId: If-1
        pinId: input
    - from:
        insId: If-1
        pinId: true
      to:
        insId: InlineValue-1
        pinId: trigger
    - from:
        insId: If-1
        pinId: false
      to:
        insId: InlineValue-2
        pinId: trigger
    - from:
        insId: InlineValue-1
        pinId: value
      to:
        insId: __this
        pinId: result
    - from:
        insId: InlineValue-2
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
      delayed: false`
  },
  ts: {
    'Flyde Code Node': `import { CodeNode } from "@flyde/core";

// This creates a custom Flyde code node that you can use in your visual flows
// After creating this file, you can drag this node from the command palette (Cmd+K)
// into your visual flows and connect it to other nodes

export const MyNode: CodeNode = {
  // Unique identifier for this node
  id: "MyNode",
  
  // Description that appears in tooltips and documentation
  description: "Processes a value and emits it to different outputs based on conditions",
  
  // Define the input pins for this node
  inputs: {
    value: { 
      description: "The input value to process",
      // mode: "required" // Uncomment to make this input required
      // mode: "reactive" // Uncomment to make this input reactive (re-triggers on changes)
    },
    threshold: {
      description: "Threshold value for comparison",
      // mode: "sticky" // Uncomment to make this input sticky (retains last value)
    }
  },
  
  // Define the output pins for this node
  outputs: {
    result: {
      description: "The processed result",
      // delayed: true // Uncomment if this output should be delayed
    },
    success: {
      description: "Emitted when value passes threshold"
    },
    error: {
      description: "Emitted when value fails threshold"  
    }
  },
  
  // Optional: Specify which outputs complete the node execution
  // completionOutputs: ["success", "error"], // Uncomment to require one of these outputs to complete
  
  // The main execution function
  run: (inputs, outputs, adv) => {
    const { value, threshold } = inputs;
    const { result, success, error } = outputs;
    
    // Process the input value
    const processedValue = value * 2;
    
    // Always emit the processed result
    result.next(processedValue);
    
    // Conditional outputs based on threshold
    if (threshold !== undefined) {
      if (processedValue >= threshold) {
        success.next({ value: processedValue, message: "Success!" });
      } else {
        error.next({ value: processedValue, message: "Below threshold" });
      }
    }
    
    // Access node state (persisted across executions)
    // const currentCount = adv.state.get('count') || 0;
    // adv.state.set('count', currentCount + 1);
    
    // Access global state (shared across all nodes)
    // const globalData = adv.globalState.get('myData');
    // adv.globalState.set('myData', { timestamp: Date.now() });
    
    // Handle errors
    // if (someErrorCondition) {
    //   adv.onError(new Error("Something went wrong"));
    //   return;
    // }
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
    const extension = type === 'flyde' ? '.flyde' : (templateName === 'Flyde Code Node' ? '.flyde.ts' : '.ts');
    
    let fileName: string = '';
    let content: string = template;
    
    if (templateName === 'Flyde Code Node') {
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
      // Find unique filename
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
            className={`flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[#2a2d2e] group ${
              activeFile === file.name ? 'bg-[#37373d] text-white' : ''
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
                className={`p-0.5 hover:bg-red-600 rounded text-xs ${
                  file.name === 'index.ts' ? 'opacity-50 cursor-not-allowed' : ''
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
          <button
            onClick={() => setShowFlydeMenu(!showFlydeMenu)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-blue-400 hover:bg-[#2a2d2e] rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>New Visual Flow</span>
          </button>
          
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

        <button
          onClick={() => handleNewFile('ts', 'Flyde Code Node')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-yellow-400 hover:bg-[#2a2d2e] rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <FileCode className="w-3.5 h-3.5 text-yellow-400" />
          <span>New Code Node</span>
        </button>
      </div>
    </div>
  );
};