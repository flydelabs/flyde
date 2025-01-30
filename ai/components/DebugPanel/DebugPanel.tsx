import { Message } from "ai";
import { VisualNode } from "@flyde/core";

interface DebugPanelProps {
  node: VisualNode | undefined;
  lastMessage: Message | undefined;
  rawAiResponse?: string;
}

export function DebugPanel({
  node,
  lastMessage,
  rawAiResponse,
}: DebugPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[250px] bg-gray-50 border-t border-gray-200 overflow-auto p-4">
      <div className="grid grid-cols-2 gap-4 h-full">
        <div>
          <h3 className="font-medium mb-2">Raw AI Response</h3>
          <pre className="bg-white p-2 rounded border overflow-auto h-[180px] text-sm">
            {rawAiResponse || "No raw response yet"}
          </pre>
        </div>
        <div>
          <h3 className="font-medium mb-2">Generated Node</h3>
          <pre className="bg-white p-2 rounded border overflow-auto h-[180px] text-sm">
            {node ? JSON.stringify(node, null, 2) : "No node generated"}
          </pre>
        </div>
      </div>
    </div>
  );
}
