import { EditorVisualNode, FlydeFlow } from "@flyde/core";
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

  const [node, setNode] = React.useState<EditorVisualNode>();

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
      const { initialNode, executionId } = bootstrapData;

      setNode(initialNode);
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

      // const node = await ports.current.read({ absPath: file.fullPath });
      setNode(node);
      setFileName(file.relativePath);
      setExecutionId(file.fullPath);
    }
  }, [bootstrapData, devServerClient, fileName, setFileName]);

  useEffect(() => {
    setNode(undefined);
    loadData();
  }, [fileName, loadData]);

  // eslint-disable-next-line no-constant-condition
  if (node) {
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
          node={node}
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
