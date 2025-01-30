import Head from "next/head";
import { Message } from "ai";
import { EmbeddedFlyde } from "@/components/EmbeddedFlyde/EmbeddedFlyde";
import { FlydeFlow, DebuggerEvent, PinType, VisualNode } from "@flyde/core";
import { HistoryPayload } from "@flyde/remote-debugger";
import { useState } from "react";
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

    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });
    const { node, rawResponse } = await response.json();
    setCurrentFlow({
      imports: {},
      node,
    });
    setRawAiResponse(rawResponse);
  };

  return (
    <>
      <Head>
        <title>Flyde AI Playground</title>
        <meta property="og:title" content="Flyde Playground" key="title" />
      </Head>
      <main className="grid grid-cols-3 h-full">
        <div className="col-span-2 border-r border-gray-200 relative">
          {currentFlow ? (
            <>
              <EmbeddedFlyde
                flow={currentFlow}
                onChange={setCurrentFlow}
                localNodes={{}}
                historyPlayer={{
                  addEvents: function (events: DebuggerEvent[]): void {
                    // throw new Error("Function not implemented.");
                  },
                  requestHistory: function (
                    insId: string,
                    pinId: string,
                    type: PinType
                  ): Promise<HistoryPayload> {
                    // throw new Error("Function not implemented.");
                    return Promise.resolve({
                      events: [],
                      history: [],
                      total: 0,
                      lastSamples: [],
                    });
                  },
                }}
              />
              <DebugPanel
                node={currentFlow.node}
                lastMessage={messages[messages.length - 1]}
                rawAiResponse={rawAiResponse}
              />
            </>
          ) : (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-lg text-gray-600 animate-pulse">
                  Generating node...
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((m: Message) => (
              <div
                key={m.id}
                className={`mb-4 ${
                  m.role === "assistant" ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200"
          >
            <input
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Build me a flow..."
            />
          </form>
        </div>
      </main>
    </>
  );
}
