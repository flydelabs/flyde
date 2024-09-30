// index.ts
import { fork } from "child_process";
import { join } from "path";
import { runFlow } from "./runFlow";
import type { FlowJob } from "@flyde/core";
import { onMessage, sendMessage } from "./typedProcessMessage";

export function forkRunFlow(data: {
  runFlowParams: Parameters<typeof runFlow>;
  cwd?: string;
}): Promise<{
  job: FlowJob;
  destroy: Function;
  result: Promise<Record<string, any>>;
}> {
  return new Promise((resolve, reject) => {
    const file = join(__dirname, "runFlow.child.js");
    const runFlowProcess = fork(file, {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      cwd: data.cwd,
    });

    runFlowProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    runFlowProcess.stderr.on("data", (data) => {
      if (data.includes("Starting inspector")) {
        return; // TODO - try fixing this issue with VSCode debugger and forked process
      }
      console.error(`stderr: ${data}`);
      reject(new Error(data));
    });

    runFlowProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`runFlow process exited with code ${code}`));
      }
    });

    const resultsPromise = new Promise((resolve, reject) => {
      onMessage(runFlowProcess, "runFlowCompleted", (result) => {
        resolve(result);

        // allow some time for remote debugger to emit all events, TODO - fix this
        setTimeout(() => {
          runFlowProcess.kill();
        }, 200);
      });
      onMessage(runFlowProcess, "runFlowError", (error) => {
        reject(error);

        // allow some time for remote debugger to emit all events, TODO - fix this
        setTimeout(() => {
          runFlowProcess.kill();
        }, 200);
      });
    });

    onMessage(runFlowProcess, "runFlowResult", (job) => {
      resolve({
        job,
        destroy: () => runFlowProcess.kill(),
        result: resultsPromise,
      });
    });

    sendMessage(runFlowProcess, "runFlow", data.runFlowParams);
  });
}
