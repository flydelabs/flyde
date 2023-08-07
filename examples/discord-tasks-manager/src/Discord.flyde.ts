import { CodeNode, nodeOutput } from "@flyde/core";
import { Client } from "eris";

const part: CodeNode = {
  id: "Discord Bot",
  inputs: {},
  defaultStyle: {
    icon: ["fab", "discord"],
    color: "#7289da",
    size: "large",
  },
  outputs: {
    interaction: nodeOutput(),
    message: nodeOutput(),
  },
  completionOutputs: [],
  run: (inputs, outputs, adv) => {
    const bot: Client = adv?.context.bot;

    bot.on("error", async (e) => {
      adv?.onError(e);
    });

    bot.on("messageCreate", async (msg) => {
      // eris overrides the toJSON method of their objects, so we need to do this to get the raw data
      outputs.message.next(msg);
    });

    bot.on("interactionCreate", async (interaction) => {
      // eris overrides the toJSON method of their objects, so we need to do this to get the raw data
      outputs.interaction.next(interaction);
    });
  },
};

export = part;
