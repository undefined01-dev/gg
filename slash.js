

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
  {
    name: 'send-ticket',
    description: 'To Send The Purchase Ticket Panel',
    required: true,
  },
  {
    name: "set-price",
    description: "To Change The Member Price",
    options: [{
      name: "price",
      description: "The New Price",
      type: 3,
      required: true,
    }]
  },//gg
  {
    name: 'send-stock',
    description: 'To Send The Member Stock Panel',
    required: true
  },
  {
    name: 'ping',
    description: 'To See The Bot Response Speed',
    required: true
  },
  {
    name: 'stock',
    description: 'To See The Quantity Of Members',
    required: true
  },
  {
    name: 'help',
    description: 'To See The Help List',
    required: true
  },
];

const clientID = "1002713312661872731";

const rest = new REST({ version: '9' }).setToken(`MTAwMjcxMzMxMjY2MTg3MjczMQ.GmvpEn.cPA2-hApAK1uzDbSvY54jGteS9tQF-zJseE1ew`);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(clientID), { body: commands });
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering application commands:', error);
  }
})();