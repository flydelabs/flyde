import { loadClientFlow } from "@flyde/runtime/dist/client-loader";
import React, { useEffect, useState } from "react";
import "./App.css";

// import {loadFlow} from '@flyde/runtime';

import flow from "./CountersList/CountersList.flyde";

const execute = loadClientFlow(flow.resolvedFlow);

const CountersListWrapper: React.FC<{}> = (props) => {
  const [child, setChild] = useState(null);

  useEffect(() => {
    const cleanPromise = execute(
      {},
      {
        onOutputs: (key, data) => {
          if (key === "jsx") {
            setChild(data);
          }
        },
      }
    );

    return () => {
      cleanPromise.then((cl) => (cl as any)());
    };
  }, []);

  return <div className="counters-list">{child}</div>;
};

function App() {
  return (
    <div className="App">
      <h1>Counters List</h1>
      <CountersListWrapper />
    </div>
  );
}

export default App;
