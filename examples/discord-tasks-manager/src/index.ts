require("dotenv").config();

import { loadFlowByPath } from "@flyde/runtime";
import eris from "eris";
import { initCommands } from "./commands";

import assert from "assert";

assert(
  process.env.BOT_TOKEN,
  `BOT_TOKEN env variable missing. Please add a ".env" file in the project's root containing "BOT_TOKEN=your-token-here")`
);

// Create a Client instance with our bot token.
const bot = new eris.Client(process.env.BOT_TOKEN);
(async () => {
  const execute = loadFlowByPath("src/Logic.flyde");

  execute({}, { extraContext: { bot } });

  bot.on("ready", async () => {
    await initCommands(bot);
  });

  bot.on("error", (err) => {
    console.warn(err);
  });

  bot.connect();
})();


