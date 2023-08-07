import { VisualNode, CodeNode, partInput, partOutput } from "@flyde/core";
import { createTasksService } from "./tasks";

const servicePromise = createTasksService();

const part: CodeNode = {
  id: "Get Tasks",
  inputs: {},
  outputs: {
    tasks: partOutput(),
  },
  run: (inputs, outputs, adv) => {
    servicePromise.then((service) => {
      service.getTasks().then((val) => {
        outputs.tasks.next(val);
      });
    });
  },
};

export = part;
