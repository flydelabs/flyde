"use client";

import "@flyde/editor/src/index.scss";
import {
  noop,
  execute,
  dynamicOutput,
  VisualNode,
  dynamicNodeInput,
  NodeInput,
  NodeOutput,
} from "@flyde/core";
import {
  DebuggerContextData,
  DebuggerContextProvider,
  FlowEditor,
  PortsContext,
  EditorPorts,
  defaultPorts,
  FlowEditorState,
  defaultBoardData,
  createRuntimePlayer,
} from "@flyde/editor";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { websiteNodesFinder } from "./nodesFinder";
import { ExampleChatbot } from "../flyde/resolved/ExampleChatbot";
import { ExampleBlogpost } from "../flyde/resolved/ExampleBlogpost";
import { resolveVisualNode } from "@flyde/loader/browser";
import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
import { createHistoryPlayer } from "./createHistoryPlayer";
import { EditorInterface, EditorTab } from "./EditorInterface";
import { MonacoCodeEditor } from "./MonacoCodeEditor";
import { BlogPreview } from "./BlogPreview";
import { ChatbotPreview } from "./ChatbotPreview";


export interface EmbeddedFlydeProps {
  activeExample?: string;
  onExampleChange?: (example: string) => void;
}

const initialPadding = [10, 10] as [number, number];

const historyPlayer = createHistoryPlayer();
const runtimePlayer = createRuntimePlayer();

const exampleFlows = {
  'blog-generator': ExampleBlogpost,
  'chatbot': ExampleChatbot,
};


export const EmbeddedFlyde = (props: EmbeddedFlydeProps) => {
  const {
    activeExample = 'blog-generator',
  } = props;

  const [activeTab, setActiveTab] = useState<string>('flow');
  const [isRunning, setIsRunning] = useState(false);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const flowEditorRef = useRef<any>(null);

  const [internalEditorState, setInternalEditorState] =
    useState<FlowEditorState>({
      flow: {
        node: {
          instances: [],
          inputsPosition: {},
          outputsPosition: {},
          connections: [],
          inputs: {},
          outputs: {},
          id: "loading",
        },
      },
      boardData: defaultBoardData
    });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currExample = exampleFlows[activeExample as keyof typeof exampleFlows];



  const runFlow = useCallback(async () => {
    setIsRunning(true);
    setExecutionResults(null);

    const localDebugger = createRuntimeClientDebugger(
      runtimePlayer,
      historyPlayer
    );
    runtimePlayer.start();

    console.log('running flow');
    const flowNode = internalEditorState.flow.node as VisualNode;

    try {
      // Resolve the visual node using browser-safe resolver
      const resolvedNode = resolveVisualNode(flowNode, websiteNodesFinder, {});

      const inputs = Object.keys(resolvedNode.inputs).reduce((acc, key) => {
        acc[key] = dynamicNodeInput();
        return acc;
      }, {} as Record<string, NodeInput>);

      const outputs = Object.keys(resolvedNode.outputs).reduce((acc, key) => {
        acc[key] = dynamicOutput();
        acc[key].subscribe((value) => {
          console.log("Flow output:", key, value);
          console.log("Raw value type:", typeof value, value);

          // Parse the InlineValue template string if it's a string that looks like a template
          let parsedValue = value;
          if (typeof value === 'string' && value.includes('subject:') && value.includes('content:')) {
            console.log("Raw InlineValue output:", value);
              // The InlineValue outputs a template string, let's try to parse it as an object
              const cleaned = value.replace(/^\s*{\s*/, '{').replace(/\s*}\s*$/, '}').replace(/(\w+):\s*"([^"]*?)"/g, '"$1": "$2"');
              console.log("Attempting to parse cleaned string:", cleaned);
              parsedValue = JSON.parse(cleaned);
          
          }

          console.log("Setting execution results for key:", key, "with parsed value:", parsedValue);
          // Update execution results immediately when we get an output
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setExecutionResults((prev: any) => {
            const newResults = {
              ...prev,
              [key]: parsedValue
            };
            console.log("New execution results:", newResults);
            return newResults;
          });
        });
        return acc;
      }, {} as Record<string, NodeOutput>);

      execute({
        node: resolvedNode,
        inputs,
        outputs,
        _debugger: localDebugger,
        onCompleted: () => {
          setIsRunning(false);
          console.log("Flow completed");

          // Show results panel after successful run
          setShowResults(true);
          
          // Re-center the board after showing results
          setTimeout(() => {
            if (flowEditorRef.current && flowEditorRef.current.centerViewPort) {
              flowEditorRef.current.centerViewPort();
            }
          }, 300);
        },
        onBubbleError: (err) => {
          setIsRunning(false);
          console.error("Flow error:", err);
        },
      });

      // Pass the topic input to start the flow
      if (inputs.topic) {
        console.log("Triggering flow with topic: AI");
        inputs.topic.subject.next('AI');
      } else {
        console.error("No topic input found!", Object.keys(inputs));
      }
    } catch (err) {
      setIsRunning(false);
      console.error('Error running flow:', err);
    }
  }, [internalEditorState.flow.node]);

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setExecutionResults(null);
        setActiveTab('flow'); // Reset to flow tab when switching examples

        // Load the selected example flow data
        setInternalEditorState(prevState => ({
          ...prevState,
          flow: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node: currExample as any, // Cast to any to avoid type issues
          },
        }));
      } catch (err) {
        console.error('Error loading flow data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlowData();
  }, [currExample]);

  const debuggerContextValue = React.useMemo<DebuggerContextData>(() => {


    return {
      onRequestHistory: (...args) => historyPlayer.requestHistory(...args),
      debuggerClient: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onBatchedEvents: noop as any,
      },
    };
  }, []);

  const portsContextValue = useMemo<EditorPorts>(() => {
    const ports: EditorPorts = {
      ...defaultPorts,
    };

    return ports;
  }, []);


  // Generate example code based on active example
  const getExampleCode = () => {
    const exampleName = activeExample === 'blog-generator' ? 'BlogGenerator' : 'Chatbot';
    const inputType = activeExample === 'blog-generator' ? '{topic: string}' : '{message: string}';
    const outputType = activeExample === 'blog-generator' ? '{blogPost: any}' : '{response: string}';
    const inputExample = activeExample === 'blog-generator' ? "'AI in 2024'" : "'Hello, how are you?'";

    return `import { loadFlow } from '@flyde/loader';

// Load the visual flow as a TypeScript function
const ${activeExample.replace('-', '')}Flow = loadFlow<${inputType}, ${outputType}>('./Flow.flyde');

// Execute with input
async function run${exampleName}(input: string) {
  const result = await ${activeExample.replace('-', '')}Flow({ 
    ${activeExample === 'blog-generator' ? 'topic' : 'message'}: input 
  });
  return result.${activeExample === 'blog-generator' ? 'blogPost' : 'response'};
}

// Usage example
const result = await run${exampleName}(${inputExample});
console.log(result);`;
  };


  // Define tabs with proper VSCode file type icons
  const tabs: EditorTab[] = [
    {
      id: 'flow',
      name: 'Flow.flyde',
      content: isLoading ? (
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p>Loading flow...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
          <div className="text-center">
            <p className="text-red-400 mb-2">Error loading flow</p>
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <PortsContext.Provider value={portsContextValue}>
          <DebuggerContextProvider value={debuggerContextValue}>
            <FlowEditor
              ref={flowEditorRef}
              state={internalEditorState}
              onChangeEditorState={setInternalEditorState}
              initialPadding={initialPadding}
              darkMode={true}
              requireModifierForZoom={true}
            />
          </DebuggerContextProvider>
        </PortsContext.Provider>
      )
    },
    {
      id: 'code',
      name: 'index.ts',
      content: (
        <MonacoCodeEditor
          code={getExampleCode()}
          language="typescript"
          readOnly={true}
        />
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading flow...</p>
        </div>
      </div>
    );
  }


  return (
    <EditorInterface
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={setActiveTab}
      onRun={runFlow}
      isRunning={isRunning}
      projectName={`${activeExample}-demo`}
      showResultsPanel={showResults}
      resultsContent={
        activeExample === 'blog-generator' ? (
          <BlogPreview data={executionResults} />
        ) : (
          <ChatbotPreview data={executionResults} />
        )
      }
      onToggleResults={() => {
        const newShowResults = !showResults;
        setShowResults(newShowResults);
        
        // Re-center the board after toggling results
        // Use a longer delay when opening the panel
        const delay = newShowResults ? 500 : 300;
        setTimeout(() => {
          if (flowEditorRef.current && flowEditorRef.current.centerViewPort) {
            flowEditorRef.current.centerViewPort();
          }
        }, delay);
      }}
    />
  );
};

// // there's a fraction of a second where the nodes are not positioned correctly in the canvas. TODO - fix this mega hack
// const CanvasPositioningWaitHack: React.FC<PropsWithChildren> = ({
//   children,
// }) => {
//   const [isReady, setIsReady] = useState(false);

//   useEffect(() => {
//     setIsReady(true);
//   }, []);

//   return (
//     <div className="embedded-wrapper flex-grow overflow-y-auto h-full relative">
//       <div className={`canvas-positioning-hack ${isReady ? "ready" : ""}`}>
//         {children}
//       </div>
//     </div>
//   );
// };

EmbeddedFlyde.displayName = "EmbeddedFlyde";
