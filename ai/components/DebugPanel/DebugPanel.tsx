import { Message } from "ai";
import { VisualNode } from "@flyde/core";

interface Diagnostics {
  duration: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface DebugPanelProps {
  node: VisualNode | undefined;
  lastMessage: Message | undefined;
  rawAiResponse?: string;
  height: number;
  diagnostics?: Diagnostics;
}

export function DebugPanel({
  node,
  lastMessage,
  rawAiResponse,
  height,
  diagnostics,
}: DebugPanelProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 overflow-auto flex flex-col"
      style={{ height }}
    >
      <div className="flex-1 p-4 overflow-auto">
        <div className="grid grid-cols-2 gap-4 h-full">
          <div>
            <h3 className="font-medium mb-2 dark:text-white">
              Raw AI Response
            </h3>
            <pre className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-auto text-sm h-full dark:text-gray-100">
              {rawAiResponse || "No raw response yet"}
            </pre>
          </div>
          <div>
            <h3 className="font-medium mb-2 dark:text-white">Generated Node</h3>
            <pre className="bg-white dark:bg-gray-950 p-2 rounded border border-gray-200 dark:border-gray-800 overflow-auto text-sm h-full dark:text-gray-100">
              {node ? JSON.stringify(node, null, 2) : "No node generated"}
            </pre>
          </div>
        </div>
      </div>
      {diagnostics && (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 text-sm flex items-center gap-6 text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{(diagnostics.duration / 1000).toFixed(2)}s</span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>{diagnostics.totalTokens} tokens</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({diagnostics.promptTokens} in / {diagnostics.completionTokens}{" "}
              out)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>${diagnostics.estimatedCost.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
