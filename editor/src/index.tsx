/* eslint-disable no-restricted-globals */

import { createRoot } from "react-dom/client";

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

import { QueryParamProvider } from "use-query-params";

import { FlowLoader } from "./integrated-flow-manager/flow-loader";

import { disableCookieAccessForVscode } from "./disable-cookie-access-for-vscode";

import "./index.scss";

disableCookieAccessForVscode();

const baseName = "";

export enum AppState {
  LOADING,
  LOADED,
}

const RoutedApp: React.FC = () => {
  return (
    <BrowserRouter basename={baseName}>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <Routes>
          <Route path="/files" element={<FlowLoader />} />
          <Route path="*" element={<Navigate to="/files" />} />
        </Routes>
      </QueryParamProvider>
    </BrowserRouter>
  );
};

const root = createRoot(document.getElementById("root") as HTMLElement); // createRoot(container!) if you use TypeScript
root.render(<RoutedApp /> as any);
