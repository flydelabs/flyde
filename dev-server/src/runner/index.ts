import { FlydeFlow } from "@flyde/core";
import { FlowJob } from "./shared";
import * as cuid from 'cuid';
import { loadFlow } from "@flyde/runtime";

// import {load} from '@flyde/runtime';

const jobsMap = new Map<string, FlowJob & {destroy: Function}>();

export async function runFlow(flow: FlydeFlow, flowPath: string, inputs: Record<string, any> = {}, port: number): Promise<FlowJob> {
    const id = cuid();

    const execute = loadFlow(flow, flowPath, `http://localhost:${port}`);

    const data = execute(inputs);

    const job: FlowJob = {
    id,
      flow
    }

    jobsMap.set(id, {...job, ...data});

    return job
}

export async function stopFlow(job: FlowJob): Promise<void> {
    const data = jobsMap.get(job.id);
    if (!data) {
        throw new Error(`Job with id ${job.id} not found`);
    }
    try {
      data.destroy();
    } catch (e) {

      console.error(`Error destroying job ${job.id}. Continuing`);
    }
    jobsMap.delete(job.id);

    return;
}