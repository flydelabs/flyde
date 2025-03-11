import { VisualNode, CodeNode, nodeInput, nodeOutput } from "@flyde/core";
import { createTasksService } from "./tasks";

const servicePromise = createTasksService();

const node: CodeNode = {
  id: "Add Task",
  inputs: {
    name: nodeInput(),
    assignee: nodeInput(),
  },
  outputs: {
    task: nodeOutput(),
  },
  run: (inputs, outputs, adv) => {
    servicePromise.then((service) => {
      const task = { name: inputs.name, assignee: inputs.assignee };
      service.addTask(task).then((val) => {
        outputs.task.next(val);
      });
    });
  },
};

export = node;
