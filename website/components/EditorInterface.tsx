"use client";

import React, { useCallback } from 'react';
import { Play, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@flyde/editor';

export type EditorTab = {
  id: string;
  name: string;
  // icon: React.ReactNode;
  content?: React.ReactNode; // Made optional since we'll pass content separately
  modified?: boolean;
};

export type EditorInterfaceProps = {
  tabs: EditorTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onRun?: () => void;
  onStop?: () => void;
  isRunning?: boolean;
  projectName?: string;
  showResultsPanel?: boolean;
  resultsContent?: React.ReactNode;
  onToggleResults?: () => void;
  content?: React.ReactNode; // Add content prop
};

export const EditorInterface: React.FC<EditorInterfaceProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onRun,
  onStop,
  isRunning = false,
  showResultsPanel = false,
  resultsContent,
  onToggleResults,
  content
}) => {
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleTabClick = useCallback((tabId: string) => {
    onTabChange(tabId);
  }, [onTabChange]);

  const handleRunClick = useCallback(() => {
    if (isRunning && onStop) {
      onStop();
    } else if (onRun && !isRunning) {
      onRun();
    }
  }, [onRun, onStop, isRunning]);

  return (
    <TooltipProvider>
      <div className="flex h-full bg-[#1e1e1e] text-gray-300">
        {/* Main Editor Area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* File Tabs with Run Button - VSCode Style */}
          <div className="flex items-center bg-[#2d2d30] border-b border-[#3c3c3c]">
            <div className="flex overflow-x-auto scrollbar-none flex-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 border-r border-[#3c3c3c] hover:bg-[#37373d] transition-all whitespace-nowrap min-h-[32px] text-sm ${activeTabId === tab.id
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                  {/* <div className="leading-none flex-shrink-0">{tab.icon}</div> */}
                  <span className="text-xs leading-none font-medium">{tab.name}</span>
                  {tab.modified && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
                  )}
                </button>
              ))}
            </div>

            {/* Run/Stop Button - Inline with tabs */}
            <div className="px-4 py-0 border-l border-[#3c3c3c]">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleRunClick}
                    className={`flex items-center space-x-2 px-4 py-1 rounded-lg text-xs font-medium transition-all ${isRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/25'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25'
                      }`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Run</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {!isRunning && (
                  <TooltipContent side="top" className="bg-[#2d2d30] text-white border-[#3c3c3c]">
                    <div className="text-center">
                      <div className="font-medium">Runs the index.ts file</div>
                      <div className="text-xs text-gray-400 mt-1">Feel free to tinker with it as you like!</div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
            {content || activeTab?.content}
          </div>
        </div>

        {/* Results Panel - Side by Side on Desktop */}
        {showResultsPanel && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-600">Blog Data Preview</span>
              {onToggleResults && (
                <button
                  onClick={onToggleResults}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              {resultsContent}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};