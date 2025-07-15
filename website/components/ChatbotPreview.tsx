"use client";

import React from 'react';
import { Copy, Check, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export type ChatbotPreviewProps = {
  data: any;
  className?: string;
};

export const ChatbotPreview: React.FC<ChatbotPreviewProps> = ({
  data,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const chatText = `User: Hello!\nBot: ${data?.response || 'No response generated yet.'}`;
      await navigator.clipboard.writeText(chatText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!data) {
    return (
      <div className={`h-full bg-gray-50 flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-500">Click "Run" to start the conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-gray-50 flex flex-col ${className}`}>
      {/* Clean Chat Header */}
      <div className="border-b border-gray-100 px-6 py-4 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
            <p className="text-sm">Hello! How are you?</p>
            <span className="text-xs opacity-75 mt-1 block">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Bot Response */}
        {data.response && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg max-w-sm shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">
                {data.response}
              </p>
              <span className="text-xs text-gray-500 mt-2 block">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Typing indicator when running */}
        {!data.response && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">AI is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input (Disabled) */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="This is a preview - run the flow to see responses"
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
          />
          <button
            disabled
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md text-sm cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};