const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'], // ← important!
});


client.commands = new Collection();

// Dynamically load all command files from the 'commands' folder
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}


const CLIENT_ID = '1360651762695933992'; // replace this
const GUILD_ID = '1360655497446817842';   // replace this

const rest = new REST({ version: '10' }).setToken(token);

// Register the command with Discord
(async () => {
  try {
    console.log('Registering slash commands...');
    const commands = commandFiles.map(file => {
      const command = require(path.join(__dirname, 'commands', file));
      return command.data.toJSON();
    });

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`${client.user.tag} is ready!`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  console.log(`Received interaction: ${interaction.commandName}`); // Debugging line
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    // Execute command only if the interaction hasn't already been replied to
    if (!interaction.replied) {
      await command.execute(interaction, client);
    } else {
      // If interaction was already replied, you may edit the reply or send a follow-up
      await interaction.editReply({ content: 'Already replied or deferred' });
    }
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      // Only reply with an error if the interaction hasn't already been replied to
      await interaction.reply({ content: 'There was an error executing this command.', flags: ['EPHEMERAL'] });
    } else {
      // If interaction already replied, send a follow-up
      await interaction.followUp({ content: 'Error occurred while processing your request.', ephemeral: true });
    }
  }
});




client.login(token);

