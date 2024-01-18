import { FlydeFlow, ResolvedDependenciesDefinitions } from "@flyde/core";
import { File, FolderStructure } from "@flyde/dev-server";
import React, { useCallback, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";
import { useQueryParam } from "use-query-params";
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
  const [resolvedDependencies, setResolvedDependencies] =
    React.useState<ResolvedDependenciesDefinitions>();

  const [executionId, setExecutionId] = React.useState<string>("n/a");

  const navigate = useNavigate();

  const devServerClient = useDevServerApi();

  const ports = useRef(
    isEmbedded
      ? createVsCodePorts()
      : createWebPorts({ devServerClient, navigate })
  );

  const loadData = useCallback(async () => {
    if (bootstrapData) {
      const { initialFlow, dependencies, executionId } = bootstrapData;

      setResolvedDependencies(dependencies);
      setFlow(initialFlow);
      setFileName("n/a");
      setExecutionId(executionId);
    } else {
      const structure = await devServerClient.fileStructure();

      const findFlydeFile = (
        structure: FolderStructure,
        fileName: string
      ): File | undefined => {
        const exists = structure.find(
          (f) =>
            !f.isFolder &&
            f.isFlyde &&
            (fileName === f.relativePath || !fileName)
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
      const resolvedDeps = await ports.current.resolveDeps({
        relativePath: file.relativePath,
      });
      setResolvedDependencies(resolvedDeps);

      const flow = await ports.current.readFlow({ absPath: file.fullPath });
      setFlow(flow);
      setFileName(file.relativePath);
      setExecutionId(file.fullPath);
    }
  }, [bootstrapData, devServerClient, fileName, setFileName]);

  useEffect(() => {
    setFlow(undefined);
    setResolvedDependencies(undefined);
    loadData();
  }, [fileName, loadData]);

  // eslint-disable-next-line no-constant-condition
  if (flow && resolvedDependencies) {
    const params = new URLSearchParams(window.location.search);
    const locationPortIfNot3000 =
      location.port === "3000" ? null : location.port;
    const port =
      Number(params.get("port") || locationPortIfNot3000) ||
      (bootstrapData?.port ?? 8545);

    return (
      <PortsContext.Provider value={ports.current}>
        <IntegratedFlowManager
          key={fileName}
          flow={flow}
          resolvedDependencies={resolvedDependencies}
          integratedSource={fileName}
          port={port}
          executionId={executionId}
        />
      </PortsContext.Provider>
    );
  } else {
    return <Loader />;
  }
};
