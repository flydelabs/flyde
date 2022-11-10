import { GroupedPart, NativePart, partInput, partOutput } from "@flyde/core";
import { createTasksService } from "./tasks";

const servicePromise = createTasksService();

const part: NativePart = {
  id: "Add Task",
  inputs: {
    name: partInput(),
    assignee: partInput(),
  },
  outputs: {
    task: partOutput(),
  },
  fn: (inputs, outputs, adv) => {
    servicePromise.then((service) => {
      const task = { name: inputs.name, assignee: inputs.assignee };
      service.addTask(task).then((val) => {
        outputs.task.next(val);
      });
    });
  },
};

export = part;
