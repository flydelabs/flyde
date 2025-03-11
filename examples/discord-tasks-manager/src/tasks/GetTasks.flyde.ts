import {
  VisualNode,
  InternalCodeNode,
  nodeInput,
  nodeOutput,
} from "@flyde/core";
import { createTasksService } from "./tasks";

const servicePromise = createTasksService();

const node: InternalCodeNode = {
  id: "Get Tasks",
  inputs: {},
  outputs: {
    tasks: nodeOutput(),
  },
  run: (inputs, outputs, adv) => {
    servicePromise.then((service) => {
      service.getTasks().then((val) => {
        outputs.tasks.next(val);
      });
    });
  },
};

export = node;
