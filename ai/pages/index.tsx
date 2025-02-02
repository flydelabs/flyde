import Head from "next/head";
import { Message } from "ai";
import { EmbeddedFlyde } from "@/components/EmbeddedFlyde/EmbeddedFlyde";
import { FlydeFlow, DebuggerEvent, PinType, VisualNode } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import { useState, useCallback, useEffect } from "react";
import { DebugPanel } from "@/components/DebugPanel/DebugPanel";

const empty: VisualNode = {
  id: "empty",
  instances: [],
  connections: [],
  inputs: {
    request: {},
  },
  outputs: {
    response: {},
  },
  inputsPosition: {
    request: { x: 0, y: 0 },
  },
  outputsPosition: {
    response: { x: 800, y: 0 },
  },
};

export default function Home() {
  const [currentFlow, setCurrentFlow] = useState<FlydeFlow | undefined>({
    imports: {},
    node: empty,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [rawAiResponse, setRawAiResponse] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<any>();
  const [debugPanelHeight, setDebugPanelHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    "gpt-4o" | "claude-3-5-sonnet" | "o3-mini"
  >("gpt-4o");
  const [planningResults, setPlanningResults] = useState<any>();
  const [speculationResults, setSpeculationResults] = useState<any>();

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const container = document.querySelector(".col-span-2");
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      setDebugPanelHeight(
        Math.max(100, Math.min(newHeight, window.innerHeight - 100))
      );
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setCurrentFlow(undefined);
    setRawAiResponse(undefined);
    setDiagnostics(undefined);
    setPlanningResults(undefined);
    setSpeculationResults(undefined);

    const requestBody = JSON.stringify({
      messages: [...messages, userMessage],
      model: selectedModel,
    });

    const [generateResponse, planResponse, speculateResponse] =
      await Promise.all([
        fetch("/api/generate", {
          method: "POST",
          body: requestBody,
        }),
        fetch("/api/plan", {
          method: "POST",
          body: requestBody,
        }),
        fetch("/api/speculate", {
          method: "POST",
          body: requestBody,
        }),
      ]);

    const [generateData, planData, speculateData] = await Promise.all([
      generateResponse.json(),
      planResponse.json(),
      speculateResponse.json(),
    ]);

    setCurrentFlow({
      imports: {},
      node: generateData.node,
    });
    setRawAiResponse(generateData.rawResponse);
    setDiagnostics(generateData.diagnostics);
    setPlanningResults(planData);
    setSpeculationResults(speculateData);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: `Flow generated successfully!\n\nPlanning Score: ${
        planData.score
      }/100\nFollow-up Question: ${
        planData.followUpQuestion
      }\n\nSpeculated Nodes: ${speculateData.nodes.join(", ")}`,
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  return (
    <>
      <Head>
        <title>Flyde AI Playground</title>
        <meta property="og:title" content="Flyde Playground" key="title" />
      </Head>
      <div className="flex flex-col h-screen">
        <header className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Flyde AI Playground
          </h1>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              Model:
            </label>
            <select
              value={selectedModel}
              onChange={(e) =>
                setSelectedModel(
                  e.target.value as "gpt-4o" | "claude-3-5-sonnet" | "o3-mini"
                )
              }
              className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              <option value="o3-mini">O3 Mini</option>
            </select>
          </div>
        </header>
        <main className="grid grid-cols-3 h-full">
          <div className="col-span-2 border-r border-gray-200 dark:border-gray-800 relative">
            {currentFlow ? (
              <>
                <div style={{ height: `calc(100% - ${debugPanelHeight}px)` }}>
                  <EmbeddedFlyde
                    flow={currentFlow}
                    onChange={setCurrentFlow}
                    localNodes={{}}
                    historyPlayer={{
                      addEvents: function (events: DebuggerEvent[]): void {},
                      requestHistory: function (
                        insId: string,
                        pinId: string,
                        type: PinType
                      ): Promise<HistoryPayload> {
                        return Promise.resolve({
                          events: [],
                          history: [],
                          total: 0,
                          lastSamples: [],
                        });
                      },
                    }}
                  />
                </div>
                <div
                  className="absolute left-0 right-0 h-2 cursor-row-resize bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 transition-colors z-10"
                  style={{ bottom: `${debugPanelHeight}px` }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing(true);
                  }}
                />
                <DebugPanel
                  node={currentFlow.node}
                  lastMessage={messages[messages.length - 1]}
                  rawAiResponse={rawAiResponse}
                  height={debugPanelHeight}
                  diagnostics={diagnostics}
                />
              </>
            ) : (
              <div className="flex justify-center items-center h-full dark:bg-gray-950">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-lg text-gray-600 dark:text-blue-200 animate-pulse">
                    Generating node...
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col h-full dark:bg-gray-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m: Message) => (
                <div
                  key={m.id}
                  className={`flex ${
                    m.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      m.role === "assistant"
                        ? "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                        : "bg-blue-500 dark:bg-blue-600 text-white"
                    }`}
                  >
                    {m.role === "assistant" && (
                      <div className="text-xs text-gray-500 dark:text-blue-200 mb-1">
                        Assistant
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-gray-200 dark:border-gray-800"
            >
              <input
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Build me a flow..."
              />
            </form>
          </div>
        </main>
      </div>
    </>
  );
}
