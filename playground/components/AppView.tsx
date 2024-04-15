"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import CodeEditor from "./CodeEditor";
import SaveIcon from "./Icons/SaveIcon";
import DownloadIcon from "./Icons/DownloadIcon";
import ForkIcon from "./Icons/ForkIcon";
import ShareIcon from "./Icons/ShareIcon";
import Tabs, { fileEquals, fileId } from "./Utils/Tabs";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Database } from "../types/supabase";
import { PlaygroundApp } from "../types/entities";
import { useRouter } from "next/navigation";

import { SimpleUser } from "@/lib/user";
import Head from "next/head";
import NewFileButton from "./NewFileButton";
import { EmbeddedFlydeFileWrapper } from "./EmbeddedFlyde/EmbeddedFlydeFileWrapper";

import { getDefaultContent } from "@/lib/defaultContent";
import {
  PlaygroundHandle,
  RuntimeStatus,
  destroyExecution,
  executeApp,
} from "@/lib/executeApp/executeApp";
import { Ok, safeParse } from "@/lib/safeParse";

import {
  DebuggerEvent,
  DynamicNodeInput,
  FlydeFlow,
  Node,
  ResolvedDependencies,
  dynamicNodeInput,
} from "@flyde/core";
import { transpileCodeNodes } from "@/lib/transpileCodeFlow";
import { createHistoryPlayer } from "@/lib/executeApp/createHistoryPlayer";
import { createRuntimePlayer, useLocalStorage } from "@flyde/flow-editor";
import { createRuntimeClientDebugger } from "@/lib/executeApp/createRuntimePlayerDebugger";
import { Resizable } from "react-resizable";
import { HomeIcon } from "./Icons/HomeIcon";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { downloadApp } from "@/lib/downloadApp";
import { IconBtn } from "./IconBtn";
import { Tooltip } from "react-tooltip";
import { EventsLog } from "./SidePanes/EventsLog";
import {
  OutputEvent,
  OutputViewerString,
} from "./SidePanes/OutputViewerString";
import { InputsPane } from "./SidePanes/InputsPane";
import { OutputViewerJsx } from "./SidePanes/OutputViewerJsx";
import { RuntimeControls } from "./RuntimeControls";
import TrashIcon from "./Icons/TrashIcon";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { useWindowSize } from "@uidotdev/usehooks";

export enum AppFileType {
  VISUAL_FLOW = "flyde",
  CODE_FLOW = "flyde.ts",
  ENTRY_POINT = "entry",
}

export interface AppFile {
  name: string;
  type: AppFileType;
  content: string;
}

export interface AppData {
  title: string;
  files: AppFile[];
}

export interface AppViewProps {
  app: PlaygroundApp;
  user: SimpleUser | null;
  baseDomain: string;
}

const resizeHandle = <div className="resize-handle" />;

function getFileToShow(app: PlaygroundApp): AppFile {
  const firstVisualFile = app.files.find(
    (file) => file.type === AppFileType.VISUAL_FLOW
  );
  return firstVisualFile ?? app.files[0];
}

export default function AppView(props: AppViewProps) {
  const { app, user } = props;

  const [savedAppData, setSavedAppData] = React.useState<AppData>(app);

  const [draftAppData, setDraftAppData] = React.useState<AppData>(app);

  const [activeFile, setActiveFile] = React.useState<AppFile>(
    getFileToShow(app)
  );

  const [editedFileTab, setEditedFileTab] = React.useState<AppFile>();

  const [localNodes, setLocalNodes] = React.useState<Record<string, Node>>({});

  const router = useRouter();
  const historyPlayer = React.useMemo(() => createHistoryPlayer(), []);

  const runtimePlayer = React.useMemo(() => {
    const player = createRuntimePlayer();
    // player.start();
    return player;
  }, []);

  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const [events, setEvents] = React.useState<DebuggerEvent[]>([]);

  const [outputMode, setOutputMode] = React.useState<"jsx" | "string">(
    "string"
  );

  const [runtimeStatus, setRuntimeStatus] = React.useState<RuntimeStatus>({
    type: "stopped",
  });

  const [runtimeDelay, setRuntimeDelay] = useState(0);

  useEffect(() => {
    runtimePlayer.start();
  }, [runtimePlayer]);

  const [outputs, setOutputs] = React.useState<OutputEvent[]>([]);

  const { width } = useWindowSize();

  const isMobile = (width ?? 0) < 768;

  const mainFlydeFlow = useMemo(() => {
    const mainFile = savedAppData.files.find(
      (file) => file.type === AppFileType.ENTRY_POINT
    );
    const mainFlydeFile = mainFile?.content.match(/['"](.*)\.flyde['"]/)?.[1];

    const file = savedAppData.files.find(
      (file) =>
        file.name === mainFlydeFile && file.type === AppFileType.VISUAL_FLOW
    );

    try {
      const parsed = safeParse<FlydeFlow>(file?.content ?? "");
      if (parsed.type === "ok") {
        return parsed.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [savedAppData.files]);

  const outputHandle = useMemo<PlaygroundHandle>(() => {
    const inputs = mainFlydeFlow
      ? Object.keys(mainFlydeFlow.node.inputs).reduce<
          Record<string, DynamicNodeInput>
        >((acc, key) => {
          acc[key] = dynamicNodeInput();
          return acc;
        }, {})
      : {};
    return {
      setMode: (mode) => setOutputMode(mode),
      addOutput: (key, value) => {
        setOutputs((prev) =>
          [{ timestamp: Date.now(), value, key }].concat(prev)
        );
      },
      inputs,
    };
  }, [mainFlydeFlow]);

  const _debugger = React.useMemo(() => {
    return createRuntimeClientDebugger(runtimePlayer, historyPlayer);
  }, [historyPlayer, runtimePlayer]);

  useEffect(() => {
    _debugger.onBatchedEvents((events: any[]) => {
      setEvents((prev) => [...events.reverse(), ...prev]);
    });
  }, [_debugger]);

  const [outputWidth, setOutputWidth] = useLocalStorage("outputWidth", 350);

  const unsavedFiles = React.useMemo(() => {
    const unsavedFiles = new Set<AppFile>();

    draftAppData.files.forEach((file) => {
      const savedFile = savedAppData.files.find(
        (f) => f.name === file.name && f.type === file.type
      );
      if (
        !savedFile ||
        savedFile.content !== file.content ||
        savedFile.name !== file.name
      ) {
        unsavedFiles.add(file);
      }
    });

    return unsavedFiles;
  }, [draftAppData, savedAppData]);

  useUnsavedChangesWarning(unsavedFiles.size > 0);

  async function fork() {
    const { data: newApp, error } = await supabase.rpc("fork_app", {
      parent_app_id: app.id,
    });

    if (error) {
      toast("Error: " + error.message);
    } else {
      toast("App forked!");
      router.push(`/apps/${newApp.id}`);
      location.reload();
    }
  }

  async function save() {
    await supabase
      .from("apps")
      .update({
        files: draftAppData.files as any,
        title: draftAppData.title,
      })
      .eq("id", props.app.id);

    setSavedAppData(draftAppData);
    toast("App saved!");
  }

  function shareOnX() {
    const prologue =
      props.user?.id === app.creator_id
        ? `I just built something awesome `
        : `Check out this awesome app built `;
    const text = `🚀 ${prologue} with the @FlydeDev visual programming playground`;
    const url = `${props.baseDomain}/apps/${app.id}`;
    const hashtags = [`Flyde`, `VisualProgramming`];

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(
      hashtags.join(",")
    )}`;

    const windowOptions =
      "scrollbars=yes,resizable=yes,toolbar=no,location=yes,width=550,height=420,top=200,left=700";
    window.open(shareUrl, "Twitter / X", windowOptions);
  }

  const deleteApp = useCallback(async () => {
    if (confirm("Are you sure you want to delete this app?")) {
      await supabase.from("apps").delete().eq("id", app.id);
      toast("App deleted");
      router.push("/");
    }
  }, [app.id, router]);

  const changeActiveFileContent = useCallback(
    (content: string) => {
      setDraftAppData((prev) => ({
        ...prev,
        files: prev.files.map((file) =>
          fileEquals(file, activeFile) ? { ...file, content } : file
        ),
      }));

      setActiveFile((prev) => ({ ...prev, content }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fileId(activeFile)]
  );

  function onDeleteFile(file: AppFile) {
    if (draftAppData.files.length === 1) {
      alert("You can't delete the last file!");
      return;
    }

    const newFiles = draftAppData.files.filter((f) => !fileEquals(f, file));
    setDraftAppData((prev) => ({
      ...prev,
      files: newFiles,
    }));
    setActiveFile(newFiles[0]);
  }

  function onRenameFile(file: AppFile, newName: string) {
    setDraftAppData((prev) => ({
      ...prev,
      files: prev.files.map((f) => {
        if (fileEquals(f, file)) {
          if (f.type === AppFileType.VISUAL_FLOW) {
            const parsed = safeParse<FlydeFlow>(f.content);
            if (parsed.type === "ok") {
              parsed.data.node.id = newName;
              return {
                ...f,
                name: newName,
                content: JSON.stringify(parsed.data, null, 2),
              };
            } else {
              return f;
            }
          }

          return { ...f, name: newName };
        } else {
          return f;
        }
      }),
    }));
    setEditedFileTab(undefined);
  }

  function onCreateFile(type: AppFile["type"]) {
    let i = 1;
    let name = `Flow${i}`;
    while (
      draftAppData.files.some(
        (file) => file.name === name && file.type === type
      )
    ) {
      i++;
      name = `Flow${i}`;
    }

    const newFile: AppFile = {
      name,
      type,
      content: getDefaultContent(name, type),
    };

    setDraftAppData((prev) => ({
      ...prev,
      files: [...prev.files, newFile],
    }));
    setActiveFile(newFile);
  }

  useEffect(() => {
    const visualNodes = draftAppData.files
      .filter((f) => f.type === AppFileType.VISUAL_FLOW)
      .map((f) => safeParse<FlydeFlow>(f.content))
      .filter((m): m is Ok<FlydeFlow> => m.type === "ok")
      .map((m) => m.data.node);

    const codeFlows = draftAppData.files
      .filter((f) => f.type === AppFileType.CODE_FLOW)
      .flatMap((f) => transpileCodeNodes(f));

    const deps = [...visualNodes, ...codeFlows].reduce<Record<string, Node>>(
      (acc, node) => ({ ...acc, [node.id]: node }),
      {}
    );

    setLocalNodes(deps);
  }, [activeFile, draftAppData.files]);

  const startExecution = useCallback(() => {
    runtimePlayer.start();
    executeApp({
      app: draftAppData,
      deps: localNodes as any,
      _debugger,
      playgroundHandle: outputHandle,
      onStatusChange: setRuntimeStatus,
      debugDelay: runtimeDelay,
    });
  }, [
    runtimePlayer,
    draftAppData,
    localNodes,
    _debugger,
    outputHandle,
    runtimeDelay,
  ]);

  const stopExecution = useCallback(() => {
    destroyExecution();
    runtimePlayer.clear();
    runtimePlayer.stop();
    // setRuntimeStatus({ type: "stopped" });
  }, [runtimePlayer]);

  const title = `${savedAppData.title} | Flyde Playground`;

  // <div className="w-full h-full flex flex-col items-center flex-1">
  return (
    <>
      {isMobile ? (
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold my-20 mx-8 text-center">
            Flyde{"'"}s Playground Currently Only Works on Desktop
          </h1>
        </div>
      ) : (
        <div className="app-view-container h-full flex flex-col w-full">
          <header className="w-full flex flex-col border-b-foreground/10 border-b bg-gray-200">
            <div className="w-full  flex flex-row p-3 text-foreground pl-8 pr-8">
              <div className="flex flex-row items-center">
                <Link
                  href="/"
                  className="w-6 h-6 fill-blue-600 mb-0.5"
                  data-tooltip-id="home"
                >
                  <HomeIcon />
                  <Tooltip content="Back to apps list" id="home" />
                </Link>
              </div>
              <input
                value={draftAppData.title}
                onChange={(e) =>
                  setDraftAppData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="App's title goes here"
                maxLength={100}
                className="bg-transparent text-foreground .hover:border-b-foreground hover:border-b transition-color duration-50 flex-1 max-w-lg mr-auto ml-5"
              />

              <div className="flex flex-row gap-4 items-center">
                <IconBtn
                  onClick={() => save()}
                  disabled={!user}
                  tooltip="Save app"
                  disabledTooltip="You need to be logged in to save"
                  svgIcon={<SaveIcon />}
                />
                <IconBtn
                  onClick={fork}
                  tooltip="Fork app"
                  disabledTooltip="You need to be logged in to fork"
                  disabled={!user}
                  svgIcon={<ForkIcon />}
                />
                <IconBtn
                  onClick={shareOnX}
                  tooltip="Share on X"
                  svgIcon={<ShareIcon />}
                />
                <IconBtn
                  onClick={() => downloadApp(draftAppData)}
                  tooltip="Download app"
                  svgIcon={<DownloadIcon />}
                />
                <IconBtn
                  onClick={deleteApp}
                  tooltip="Delete app"
                  disabled={user?.id !== app.creator_id}
                  disabledTooltip="You can only delete apps you created"
                  svgIcon={<TrashIcon />}
                />
              </div>
            </div>
          </header>

          <main className="flex flex-row  w-full h-full overflow-hidden">
            <div
              className="flex flex-col border-r border-r-foreground/10 flex-grow"
              style={{ width: `calc(100% - ${outputWidth}px)` }}
            >
              <header
                className="w-full border-b border-b-foreground/10 flex flex-row items-center overflow-x-auto scroll-b pt-1"
                style={{ scrollbarWidth: "thin" }}
              >
                <Tabs
                  files={draftAppData.files}
                  unsavedFiles={unsavedFiles}
                  activeFile={activeFile}
                  onDeleteFile={onDeleteFile}
                  onChangeActiveFile={(newActiveFile) => {
                    setActiveFile(newActiveFile);
                    setEditedFileTab(undefined);
                  }}
                  onRenameFile={onRenameFile}
                  onSetEditedFile={(file) => setEditedFileTab(file)}
                  editedFile={editedFileTab}
                />
                <NewFileButton onCreateFile={onCreateFile} />
              </header>
              <div className="flex-grow overflow-y-auto h-full">
                {activeFile.type === AppFileType.VISUAL_FLOW ? (
                  <EmbeddedFlydeFileWrapper
                    localNodes={localNodes as ResolvedDependencies}
                    key={activeFile.name}
                    fileName={activeFile.name}
                    content={activeFile.content}
                    onFileChange={changeActiveFileContent}
                    historyPlayer={historyPlayer}
                  />
                ) : (
                  <CodeEditor
                    key={activeFile.name}
                    value={activeFile.content}
                    onChange={changeActiveFileContent}
                  />
                )}
              </div>
            </div>

            <Resizable
              height={0}
              width={outputWidth}
              onResize={(_m, { size: { width } }) => setOutputWidth(width)}
              axis="x"
              resizeHandles={["w"]}
              minConstraints={[350, 0]}
              maxConstraints={[2000, 0]}
              handle={resizeHandle}
            >
              <div className="flex flex-col" style={{ width: outputWidth }}>
                <RuntimeControls
                  delay={runtimeDelay}
                  onDelayChange={setRuntimeDelay}
                  run={startExecution}
                  stop={stopExecution}
                  status={runtimeStatus}
                />
                {/* <InputsPane
                  flow={mainFlydeFlow}
                  inputs={outputHandle.inputs}
                  status={runtimeStatus}
                /> */}
                {outputMode === "string" ? (
                  <OutputViewerString
                    events={outputs}
                    clearEvents={() => setOutputs([])}
                  />
                ) : (
                  <OutputViewerJsx events={outputs} />
                )}

                <EventsLog events={events} clearEvents={() => setEvents([])} />
              </div>
            </Resizable>
          </main>
          <Head>
            <title>{title}</title>
            <meta property="og:title" content={title} key="title" />
          </Head>
        </div>
      )}
    </>
  );
}
