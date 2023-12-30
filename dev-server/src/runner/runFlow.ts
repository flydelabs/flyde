import { FlydeFlow } from "@flyde/core";
import { FlowJob } from "./shared";
import { createId } from "@paralleldrive/cuid2";
import { loadFlowFromContent } from "@flyde/runtime";

import "dotenv/config";

export async function runFlow(
  flow: FlydeFlow,
  flowPath: string,
  inputs: Record<string, any> = {},
  port: number,
  executionDelay: number
): Promise<{
  job: FlowJob;
  result: Promise<Record<string, any>>;
  destroy: Function;
}> {
  const id = createId();

  const execute = loadFlowFromContent(
    flow,
    flowPath,
    `http://localhost:${port}`
  );

  const data = execute(inputs, { executionDelay });

  const job: FlowJob = {
    id,
    flow,
  };

  return { job, result: data.result, destroy: data.destroy };
}
2;
