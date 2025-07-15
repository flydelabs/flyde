import { useState } from "react";
import { EmbeddedFlyde } from "@/components/EmbeddedFlyde";

export default function TestEmbeddedFlyde() {
  const [logs, setLogs] = useState<Array<{ timestamp: string; value: unknown }>>([]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Embedded Flyde with Execution</h1>
        
        <div className="mb-4 flex gap-4">
          <button
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
          >
            Clear Logs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Visual Editor</h2>
            <div className="h-[600px] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
              <EmbeddedFlyde />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Console Output</h2>
            <div className="h-[600px] bg-zinc-900 rounded-lg p-4 overflow-y-auto border border-zinc-800">
              {logs.length === 0 ? (
                <p className="text-zinc-500">No logs yet. Run the flow to see output.</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-zinc-500">{log.timestamp}:</span>
                      <pre className="mt-1 text-zinc-300">{JSON.stringify(log.value, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}