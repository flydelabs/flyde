"use client";

import React from 'react';
import { FileText, MessageCircle } from 'lucide-react';

export type SubtleExamplePickerProps = {
  activeExample: string;
  onExampleChange: (example: string) => void;
  className?: string;
};

const examples = [
  {
    id: 'blog-generator',
    name: 'Blog Generator',
    icon: FileText,
    description: 'AI-powered blog post creation'
  },
  {
    id: 'chatbot', 
    name: 'Chatbot',
    icon: MessageCircle,
    description: 'Interactive conversation AI'
  }
];

export const SubtleExamplePicker: React.FC<SubtleExamplePickerProps> = ({
  activeExample,
  onExampleChange,
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      <span className="text-xs text-gray-500 mr-3">Examples:</span>
      {examples.map((example, index) => (
        <React.Fragment key={example.id}>
          <button
            onClick={() => onExampleChange(example.id)}
            className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
              activeExample === example.id
                ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            <example.icon className="w-3 h-3" />
            <span className="font-medium">{example.name}</span>
          </button>
          {index < examples.length - 1 && (
            <div className="w-px h-3 bg-gray-700"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};