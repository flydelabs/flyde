"use client";

import { RuntimeStatus } from "@/lib/executeApp/executeApp";
import { InfoTooltip } from "./InfoToolip";
import { Fragment } from "react";

export interface RuntimeControlsProps {
  run: () => void;
  stop: () => void;
  status: RuntimeStatus;
  onDelayChange: (delay: number) => void;
  delay: number;
}

export function RuntimeControls(props: RuntimeControlsProps) {
  const { run, stop, status } = props;

  const runOrStopBtn =
    status.type !== "running" ? (
      <button
        className="py-2 px-5 rounded-md no-underline bg-blue-200 hover:bg-blue-300 text-white font-semibold"
        onClick={run}
      >
        Run
      </button>
    ) : (
      <button
        className="py-2 px-5 rounded-md no-underline bg-blue-200 hover:bg-blue-300 text-white font-semibold"
        onClick={stop}
      >
        Stop
      </button>
    );
  return (
    <div className="runtime-controls flex flex-row bg-slate-100 py-1 pt-1.5 px-1 w-full justify-between items-center border-b border-gray-200 ">
      {runOrStopBtn}

      <div className="mx-4">
        <span className="font-bold">
          {status.type === "running" ? "Running" : "Stopped"}
        </span>
      </div>
      <div className="flex flex-row flex-nowrap justify-center items-center">
        <div className="flex flex-col translate-y-[8px] items-center">
          <input
            id="labels-range-input"
            type="range"
            value={props.delay}
            onChange={(e) => props.onDelayChange(parseInt(e.target.value))}
            min="0"
            step="100"
            disabled={status.type === "running"}
            max="1500"
            className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 w-[100px]"
          />
          <span className="text-[10px] mt-0.5">
            {props.delay ? (
              <Fragment>{props.delay}ms delay</Fragment>
            ) : (
              <Fragment>No delay</Fragment>
            )}
            <InfoTooltip content="Delays the execution of the flow by the specified amount of milliseconds. Useful for debugging and visualizing data flows." />
          </span>
        </div>
      </div>
    </div>
  );
}
