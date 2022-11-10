import { GroupedPart, NativePart, partInput, partOutput } from "@flyde/core";
import { createTasksService } from "./tasks";

const servicePromise = createTasksService();

const part: NativePart = {
  id: "Get Tasks",
  inputs: {
  },
  outputs: {
    tasks: partOutput(),
  },
  fn: (inputs, outputs, adv) => {
    servicePromise.then((service) => {
      service.getTasks().then((val) => {
        outputs.tasks.next(val);
      });
    });
  },
};

export = part;
