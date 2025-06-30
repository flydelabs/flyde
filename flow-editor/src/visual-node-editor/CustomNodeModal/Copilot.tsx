import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

import { Button, HotkeyIndication, X, SendIcon, AiIcon } from "@flyde/ui";


import { generateNodeCode, Message as ApiMessage } from './apiService';
import { CustomCodeGenerationResult } from './types';

interface Message {
  role: "assistant" | "user";
  content: string;
  loading?: boolean;
}

const defaultMessages: Message[] = [];

export function Copilot({
  isOpen,
  onClose,
  onPropose,
  onAccept,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (code: string | undefined) => void;
  onAccept: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [proposedChanges, setProposedChanges] = useState<string | null>(
    null
  );

  const handleApiResponse = useCallback(async (response: CustomCodeGenerationResult) => {
    switch (response.type) {
      case 'success':
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "✅ Generated code successfully!" },
        ]);
        onPropose(response.rawCodeNode);
        break;
      case 'followup':
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.text },
        ]);
        break;
      case 'error':
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${response.error}` },
        ]);
        break;
    }
    setIsTyping(false);
  }, [onPropose]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Convert app messages to API message format
      const messageHistory: ApiMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Add the current message
      messageHistory.push({ role: "user", content: input });

      const response = await generateNodeCode({
        prompt: input,
        messageHistory
      });

      handleApiResponse(response);
    } catch (error) {
      console.error('Failed to generate code:', error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error while processing your request." }
      ]);
      setIsTyping(false);
    }
  }, [input, isTyping, handleApiResponse, messages]);

  const handleAcceptChanges = () => {
    if (proposedChanges) {
      // For demo purposes, it will always use the example code
      // In a real implementation, you would use the actual code from the API
      onAccept();
      setProposedChanges(null);
      onPropose(undefined); // Clear the diff view
    }
  };

  const handleRejectChanges = () => {
    onPropose(undefined); // Clear the diff view
    setProposedChanges(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col max-h-[calc(100vh-120px)] overflow-y-auto w-[350px]">
      <div className="p-2 border-b border-neutral-800 flex justify-between items-center bg-neutral-800/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-neutral-200">AI Flowpilot</h2>
        </div>
        <Button
          onClick={onClose}
          className="!h-6 !w-6.5 !px-1 !py-1 !min-w-0 !bg-neutral-700/50 hover:!bg-neutral-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.map((message, i) => {
          const showAvatar = i === 0 || messages[i - 1]!.role !== message.role;
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2",
                message.role === "assistant" ? "" : "ml-4"
              )}
            >
              {message.role === "assistant" ? (
                showAvatar ? (
                  <BotIndicator />
                ) : (
                  <div className="w-6" />
                )
              ) : showAvatar ? (
                <div className="rounded-full overflow-hidden h-5 w-5 border-gray-200 border dark:border-gray-600 flex-shrink-0">
                  <span>?</span>
                </div>
              ) : (
                <div className="w-5" />
              )}
              <div
                className={cn(
                  "px-2 py-1 rounded-lg text-sm flex-1",
                  message.role === "assistant"
                    ? "border border-neutral-700/50 text-neutral-200"
                    : "bg-neutral-800 text-neutral-200 border border-neutral-700/50"
                )}
              >
                {message.content}
              </div>
            </div>
          );
        })}
        {proposedChanges && (
          <div className="flex items-start gap-2">
            <BotIndicator />
            <div className="bg-neutral-800 rounded-lg p-4 max-w-[85%]">
              <div className="text-neutral-200 font-medium mb-4">
                Review Changes
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleRejectChanges}
                  className="!h-8 !min-w-0 !px-3"
                >
                  Reject
                </Button>
                <Button
                  onClick={handleAcceptChanges}
                  className="!h-8 !min-w-0 !px-3"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        )}
        {isTyping && (
          <div className="flex items-start gap-2">
            <BotIndicator />
            <div className="px-2 py-1 rounded-lg text-sm border border-neutral-700/50 text-neutral-200">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-neutral-800 bg-neutral-800/50">
        <div className="flex gap-1">
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask your Flowpilot..."
              className="w-full px-2 py-1 text-sm rounded-md border border-neutral-700 bg-neutral-900 text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden pr-12"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="!h-[30px] !min-w-0 !px-2 disabled:opacity-50 flex items-center gap-1.5"
          >
            <SendIcon className="w-4 h-4" />
            <HotkeyIndication hotkey="⏎" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function BotIndicator() {
  return (
    <div className="h-6 w-6 flex-shrink-0 bg-fblue-600/30 rounded-full p-[4px] ">
      <AiIcon size={15} />
    </div>
  );
}
