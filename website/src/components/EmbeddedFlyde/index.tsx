import React, {
    useEffect,
    useRef,
    useState,
  } from "react";
  import * as PubSub from "pubsub-js";
  import {
    createNewPartInstance,
    createRuntimePlayer,
    FlowEditor,
    FlowEditorState,
    FlydeFlowEditorProps,
    RuntimePlayer,
    toastMsg,
    useDebounce,
    vAdd,
  } from "@flyde/flow-editor";
  import { fakeVm } from "@site/src/fake-vm";
  import {
    BasePart,
    DynamicPartInput,
    execute,
    FlydeFlow,
    isBasePart,
    keys,
    noop,
    Part,
    PartInputs,
    PartInstance,
    PartOutput,
    ResolvedFlydeRuntimeFlow,
    TRIGGER_PIN_ID,
  } from "@flyde/core";
  import { createHistoryPlayer } from "./createHistoryPlayer";
  import { createRuntimeClientDebugger } from "./createRuntimePlayerDebugger";
  
  import "@flyde/flow-editor/src/index.scss";

  import produce from "immer";
  import BrowserOnly from "@docusaurus/BrowserOnly";
  import { EditorDebuggerClient } from "@site/../remote-debugger/dist";
  
  (global as any).vm2 = fakeVm;
  
  const historyPlayer = createHistoryPlayer();

  const initialPadding = [0, 10] as [number, number];
  
  export interface EmbeddedFlydeProps {
    flowProps: {
      inputs: Record<string, DynamicPartInput>;
      flow: FlydeFlow;
      resolvedFlow: ResolvedFlydeRuntimeFlow;
      output: PartOutput;
    };
    debugDelay: number;
    onOutput: (data: any) => void;
  }
  
  export type PlaygroundFlowDto = {
    flow: ResolvedFlydeRuntimeFlow;
    output: PartOutput;
    inputs: PartInputs;
    onError: any;
    debugDelay?: number;
    player: RuntimePlayer;
  };
  
  const runFlow = ({
    flow,
    output,
    inputs,
    onError,
    debugDelay,
    player,
  }: PlaygroundFlowDto) => {
    const localDebugger = createRuntimeClientDebugger(player, historyPlayer);
  
    localDebugger.debugDelay = debugDelay;
  
    const firstOutputName = keys(flow.main.outputs)[0];
  
    return {
      executeResult: execute({
        part: flow.main,
        inputs: inputs,
        outputs: { [firstOutputName]: output },
        partsRepo: { ...flow.dependencies, [flow.main.id]: flow.main },
        _debugger: localDebugger,
        onBubbleError: (e) => {
          onError(e);
        },
        extraContext: {
          PubSub,
        },
      }),
      localDebugger,
    };
  };
  
  export const EmbeddedFlyde: React.FC<EmbeddedFlydeProps> = (
    props
  ) => {
    const {debugDelay, onOutput, flowProps} = props;
    const { flow, inputs, output } = flowProps;

    const runtimePlayerRef = useRef(
      createRuntimePlayer("root." + props.flowProps.flow.part.id)
    );
  
    const [resolvedFlow, setResolvedFlow] = useState<ResolvedFlydeRuntimeFlow>(
      props.flowProps.resolvedFlow
    );
  
    const [localDebugger, setLocalDebugger] =
      useState<Pick<EditorDebuggerClient, "onBatchedEvents">>();
  
    const [debouncedFlow] = useDebounce(resolvedFlow, 500);
  
    const [editorState, setFlowEditorState] = useState<FlowEditorState>({
      flow,
      boardData: {
        viewPort: {
          pos: { x: 0, y: 0 },
          zoom: 1,
        },
        lastMousePos: { x: 0, y: 0 },
        selected: [],
      },
    });
  
    useEffect(() => {
      setResolvedFlow((f) => ({ ...f, main: editorState.flow.part }));
    }, [editorState.flow.part]);
  
    const flowEditorProps: FlydeFlowEditorProps = {
      state: editorState,
      resolvedRepoWithDeps: resolvedFlow,
      onChangeEditorState: setFlowEditorState,
      onInspectPin: noop,
      onRequestHistory: historyPlayer.requestHistory,
      hideTemplatingTips: true,
      initialPadding,
      onImportPart: async (importedPart, target) => {
        const { part } = importedPart;
      
        const depPart = Object.values(
          await import("@flyde/stdlib/dist/all-browser")
        ).find((p) => isBasePart(p) && p.id === part.id) as Part;
  
        setResolvedFlow((flow) => {
          return {
            ...flow,
            dependencies: {
              ...flow.dependencies,
              [depPart.id]: {
                ...depPart,
                source: {
                  path: "@flyde/stdlib/dist/all-browser",
                  export: depPart.id,
                }, // fake, for playground
              },
            },
          };
        });
  
        let newPartIns: PartInstance | undefined = undefined;
  
        const newFlow = produce(flow, (draft) => {
          if (target) {
            const finalPos = vAdd({ x: 0, y: 0 }, target.pos);
            newPartIns = createNewPartInstance(
              importedPart.part,
              0,
              finalPos,
              resolvedFlow.dependencies
            );
            draft.part.instances.push(newPartIns);
  
            if (target.connectTo) {
              const { insId, outputId } = target.connectTo;
              draft.part.connections.push({
                from: {
                  insId,
                  pinId: outputId,
                },
                to: {
                  insId: newPartIns.id,
                  pinId: TRIGGER_PIN_ID,
                },
              });
            }
          }
        });
  
        // yacky hack to make sure flow is only rerendered when the new part exists
        await new Promise((resolve) => setTimeout(resolve, 10));
  
        const newState = produce(editorState, (draft) => {
          draft.flow = newFlow;
          if (target?.selectAfterAdding && newPartIns) {
            draft.boardData.selected = [newPartIns?.id];
          }
        });
  
        setFlowEditorState(newState);
  
        toastMsg(`Part ${part.id} successfully imported from ${importedPart.module}`);
        return newPartIns;
      },
      onExtractInlinePart: noop as any,
      onQueryImportables: async () => {
        const parts = Object.values(
          await import("@flyde/stdlib/dist/all-browser")
        ).filter(isBasePart) as BasePart[];
        return parts.map((b) => ({ part: b, module: "@flyde/stdlib" }));
      },
      debuggerClient: localDebugger as EditorDebuggerClient,
    };
  
    useEffect(() => {
      runtimePlayerRef.current.start();
    }, []);
  
    useEffect(() => {
      const { executeResult: clean, localDebugger } = runFlow({
        flow: resolvedFlow,
        output,
        inputs,
        onError: noop,
        debugDelay: debugDelay,
        player: runtimePlayerRef.current,
      });
      const sub = props.flowProps.output.subscribe((data) => onOutput(data));
      setLocalDebugger(localDebugger);
      return () => {
        clean();
        sub.unsubscribe();
      };
    }, [debugDelay, debouncedFlow]);
  
    return (
            <BrowserOnly>
            {() => <FlowEditor {...flowEditorProps} />}
            </BrowserOnly>
    );
  };
  