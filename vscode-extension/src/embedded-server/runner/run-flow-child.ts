import { runFlow } from "./run-flow";
import { onMessage, sendMessage } from "./typed-process-message";

onMessage(process, "runFlow", async (params) => {
  const { job, destroy, result } = await runFlow(...params);

  sendMessage(process, "runFlowResult", job);

  onMessage(process, "destroyRunFlow", () => {
    destroy();
  });

  result.then(
    (result) => {
      sendMessage(process, "runFlowCompleted", result);
    },
    (error) => {
      sendMessage(process, "runFlowError", error);
    }
  );
});