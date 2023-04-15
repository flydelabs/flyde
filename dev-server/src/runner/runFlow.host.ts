// index.ts
import { fork } from "child_process";
import { join } from "path";
import { runFlow } from "./runFlow";
import { FlowJob } from "./shared";
import { onMessage, sendMessage } from "./typedProcessMessage";

export function forkRunFlow(...params: Parameters<typeof runFlow>): Promise<{
  job: FlowJob;
  destroy: Function;
  result: Promise<Record<string, any>>;
}> {
  return new Promise((resolve, reject) => {
    const file = join(__dirname, "runFlow.child.js");
    const runFlowProcess = fork(file, {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    });

    runFlowProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    runFlowProcess.stderr.on("data", (data) => {
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
        runFlowProcess.kill("0");
      });
      onMessage(runFlowProcess, "runFlowError", (error) => {
        reject(error);
        runFlowProcess.kill("1");
      });
    });

    onMessage(runFlowProcess, "runFlowResult", (job) => {
      resolve({
        job,
        destroy: () => runFlowProcess.kill("0"),
        result: resultsPromise,
      });
    });

    sendMessage(runFlowProcess, "runFlow", params);
  });
}
