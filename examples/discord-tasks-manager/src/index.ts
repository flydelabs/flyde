require("dotenv").config();

import { loadFlow } from "@flyde/runtime";
import eris from "eris";
import { initCommands } from "./commands";

import assert from 'assert';

assert(process.env.BOT_TOKEN, `BOT_TOKEN env variable missing. Please add a ".env" file in the project's root containing "BOT_TOKEN=yourtokenhere")`);

// Create a Client instance with our bot token.
const bot = new eris.Client(process.env.BOT_TOKEN);
(async () => {
  const execute = loadFlow('src/Main.flyde');
  
  execute({}, {extraContext: {bot}});
  
  bot.on("ready", async () => {
    await initCommands(bot);
  });

  bot.on("error", (err) => {
    console.warn(err);
  });

  bot.connect();
})();


