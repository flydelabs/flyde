# Flyde Example Project - Discord Tasks Manager

A discord bot that manages a simple to-do list. Built using:

- _Flyde_ ✨
- Typescript
- [Eris](https://abal.moe/Eris/) as the Discord client
- [LokiJS](https://github.com/techfort/LokiJS) for persistence

![Preview](preview.gif)

## Prerequisites

1. [VS Code](https://code.visualstudio.com/)
2. [Flyde VS Code Extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
3. Yarn

## Running locally

1. Create a new Discord bot and fetch its token. Check [this link](https://www.writebots.com/discord-bot-token/) for instructions
2. Add your bot to a Discord server
3. Add a ".env" file with this line "BOT_TOKEN=XXX" and replace XXX with your token
4. `npm install`
5. `npm start`
6. Open "src/Main.flyde"
7. Interact with your bot and see parts lighting up!

## Next steps

1. Send a message when an unsupported command is sent
2. Add a command to delete all tasks
3. Send a DM to the assignee when a task is created with them as the assignee

Looking to learn more about Flyde? Visit the official website at https://www.flyde.dev
