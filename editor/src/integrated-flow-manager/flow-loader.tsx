import { FlydeFlow, ResolvedFlydeFlowDefinition } from "@flyde/core";
import { File, FolderStructure } from "@flyde/dev-server";
import React, { useCallback, useEffect, useRef } from "react";

import { useHistory, useLocation } from "react-router-dom";
import { BooleanParam, useQueryParam } from "use-query-params";
import { useDevServerApi } from "../api/dev-server-api";
import { Loader, PortsContext } from "@flyde/flow-editor"; // ../../common/lib/loader
import { IntegratedFlowManager } from "./IntegratedFlowManager";
import { createVsCodePorts } from "../vscode-ports";
import { createWebPorts } from "../web-ports";
import { useBootstrapData } from "./use-bootstrap-data";

export const FlowLoader: React.FC = (props) => {
  const [fileName, setFileName] = useQueryParam<string>("fileName");

  const bootstrapData = useBootstrapData();
  const isEmbedded = !!bootstrapData;

  const [flow, setFlow] = React.useState<FlydeFlow>();
  const [resolvedDefinitions, setResolvedDefinitions] =
    React.useState<ResolvedFlydeFlowDefinition>();

  const history = useHistory();
  const { search } = useLocation();

  const devServerClient = useDevServerApi();

  const ports = useRef(isEmbedded ? createVsCodePorts() : createWebPorts({devServerClient, history}));

  const loadData = useCallback(async () => {

    if (bootstrapData) {

      const {initialFlow, dependencies} = bootstrapData;
      
      setResolvedDefinitions(dependencies);
      setFlow(initialFlow);
      setFileName('n/a');
    } else {
      const structure = await devServerClient.fileStructure();

      const findFlydeFile = (structure: FolderStructure, fileName: string): File | undefined => {
        const exists = structure.find(
          (f) => !f.isFolder && f.isFlyde && (fileName === f.relativePath || !fileName)
        ) as File;
  
        if (exists) {
          return exists;
        }
        return structure.reduce<File | undefined>((acc, curr) => {
          if (acc) {
            return acc;
          }
          if (curr.isFolder) {
            return findFlydeFile(curr.children, fileName);
          }
          return undefined;
        }, undefined);
      };
  
      const file = findFlydeFile(structure, fileName);
  
      if (!file) {
        throw new Error("No .flyde file found in project");
      }
      const resolvedDefinitions = await ports.current.resolveDeps({absPath: file.fullPath});
      setResolvedDefinitions(resolvedDefinitions);
  
      const flow = await ports.current.readFlow({absPath: file.fullPath});
      setFlow(flow);
      setFileName(file.relativePath);
    }
    
    
  }, [devServerClient, fileName, isEmbedded, setFileName]);

  React.useEffect(() => {}, [history, devServerClient, fileName, setFileName, search]);

  useEffect(() => {
    setFlow(undefined);
    setResolvedDefinitions(undefined);
    loadData();
  }, [fileName, loadData]);

  // eslint-disable-next-line no-constant-condition
  if (flow && resolvedDefinitions) {
    const params = new URLSearchParams(window.location.search);
    const locationPortIfNot3000 = location.port === "3000" ? null : location.port;
    const port = Number(params.get("port") || locationPortIfNot3000 || 8545);

    console.log("Rendering", fileName, flow.part);

    return (
      <PortsContext.Provider value={ports.current}>
      <IntegratedFlowManager 
        key={fileName}
        flow={flow}
        resolvedDefinitions={resolvedDefinitions}
        initialPart={flow.part}
        integratedSource={fileName}
        port={port}
      />
      </PortsContext.Provider>
    );
  } else {
    return <Loader />;
  }
};
