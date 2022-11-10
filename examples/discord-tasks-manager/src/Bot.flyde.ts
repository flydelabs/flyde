import { NativePart, partOutput } from "@flyde/core";
import { Client } from "eris";

const part: NativePart = {
  id: "Discord Bot",
  inputs: {},
  defaultStyle: {
    icon: ['fab', 'discord'],
    color: '#7289da',
    size: 'large'
  },
  outputs: {
    interaction: partOutput(),
    message: partOutput()
  },
  fn: (inputs, outputs, adv) => {
    const bot: Client = adv?.context.bot;

    bot.on("error", async (e) => {
      adv?.onError(e);
    });
  
    bot.on("messageCreate", async (msg) => {
      outputs.message.next(msg);
    });
  
    bot.on("interactionCreate", async (interaction) => {      
      outputs.interaction.next(interaction);
    });
  },
};

export = part;
