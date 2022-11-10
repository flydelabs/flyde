/* eslint-disable no-restricted-globals */
import * as React from "react";
import * as ReactDOM from "react-dom";

import { FocusStyleManager } from "@blueprintjs/core";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";

import { Loader } from "@flyde/flow-editor"; // ../common/lib/loader
import { QueryParamProvider } from "use-query-params";

import { FlowLoader } from "./integrated-flow-manager/flow-loader";

import {disableCookieAccessForVscode} from './disable-cookie-access-for-vscode';

import "./index.scss";

disableCookieAccessForVscode();
FocusStyleManager.onlyShowFocusOnTabs();

const baseName = "/editor";

export enum AppState {
  LOADING,
  LOADED,
}

const RoutedApp = () => {
  const [appState, setAppState] = React.useState(AppState.LOADED);

  const renderInnerApp = () => {
    switch (appState) {
      case AppState.LOADING:
        return <Loader />;
      case AppState.LOADED:
        return (
          <Switch>
            <Route path="/files">
              <FlowLoader />
            </Route>
            <Redirect to="/files" />
          </Switch>
        );
    }
  };

  return (
    <BrowserRouter basename={baseName}>
      <QueryParamProvider ReactRouterRoute={Route}>
        {renderInnerApp()}
      </QueryParamProvider>
    </BrowserRouter>
  );
};

ReactDOM.render(<RoutedApp />, document.getElementById("root") as HTMLElement);
// registerServiceWorker();
