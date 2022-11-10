import { createDevServerClient, DevServerClient } from "@flyde/dev-server";
import React, { useContext } from "react";

const params = new URLSearchParams(window.location.search);

const locationPortIfNot3000 = location.port === "3000" ? null : location.port;
const port = params.get("port") || locationPortIfNot3000 || 8545;

const defaultDevServerClient = createDevServerClient("http://localhost:" + port);

export const DevServerApiContext =
  React.createContext<DevServerClient>(defaultDevServerClient);

export const useDevServerApi = (): DevServerClient => {
  return useContext(DevServerApiContext);
};
