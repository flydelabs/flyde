import { Constants, ApplicationCommandStructure, Client } from "eris";

/*
 Looking to add new commands? Check out this great tool - https://autocode.com/tools/discord/embed-builder/ 
 Build commands using a visual editor and then paste it's code here (just the config)
*/

const commands: ApplicationCommandStructure[] = [
  {
    name: "tasks",
    description: "Manage tasks",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
    options: [
      {
        type: 1,
        name: "add",
        description: "Adds a new task",
        options: [
          {
            type: 3,
            name: "name",
            description: "The name of the task",
            required: true,
          },
          {
            type: 6,
            name: "assignee",
            description: "Optional assignee of the task",
            channel_types: undefined as never,
          },
        ],
      },
      {
        type: 1,
        name: "list",
        description: "List all tasks",
      },
    ],
  },
  {
    name: "Test User Menu",
    type: Constants.ApplicationCommandTypes.USER,
  },

  {
    name: "Test Message Menu",
    type: Constants.ApplicationCommandTypes.MESSAGE,
  }, //Create a message context menu

  {
    name: "test_edit_command",
    description: "Test command to show off how to edit commands",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT, //Not required for Chat input type, but recommended
  }, //Create a chat input command

  {
    name: "test_delete_command",
    description: "Test command to show off how to delete commands",
    type: Constants.ApplicationCommandTypes.CHAT_INPUT, //Not required for Chat input type, but recommended
  }, //Create a chat input command
];

export const initCommands = async (client: Client) => {
  const existingCommands = await client.getCommands();

  const missingCommands = commands.filter((cmd) => {
    return !existingCommands.some((eCmd) => eCmd.name === cmd.name);
  });

  const extraCommands = existingCommands.filter((cmd) => {
    return commands.every((eCmd) => eCmd.name !== cmd.name);
  });

  console.log(
    `Found ${missingCommands.length} commands and ${extraCommands.length} extra commands`
  );
  for (const cmd of missingCommands) {
    console.log(`Creating ${cmd.name}`);
    await client.createCommand(cmd);
    console.log(`Created ${cmd.name}`);
  }

  for (const cmd of extraCommands) {
    console.log(`Removing ${cmd.name}`);
    await client.deleteCommand(cmd.id);
    console.log(`Removed ${cmd.name}`);
  }
};
