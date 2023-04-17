/* eslint-disable no-restricted-globals */
import * as React from "react";
import * as ReactDOM from "react-dom";

import { FocusStyleManager } from "@blueprintjs/core";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import { QueryParamProvider } from "use-query-params";

import { FlowLoader } from "./integrated-flow-manager/flow-loader";

import { disableCookieAccessForVscode } from "./disable-cookie-access-for-vscode";

import "./index.scss";

disableCookieAccessForVscode();
FocusStyleManager.onlyShowFocusOnTabs();

const baseName = "/editor";

export enum AppState {
  LOADING,
  LOADED,
}

const RoutedApp = () => {
  return (
    <BrowserRouter basename={baseName}>
      <QueryParamProvider ReactRouterRoute={Route}>
        <Switch>
          <Route path="/files">
            <FlowLoader />
          </Route>
          <Redirect to="/files" />
        </Switch>
      </QueryParamProvider>
    </BrowserRouter>
  );
};

ReactDOM.render(<RoutedApp />, document.getElementById("root") as HTMLElement);
// registerServiceWorker();
