const { SlashCommandBuilder } = require('discord.js');
const helpEmbed = require('../embeds/helpEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands'),

    async execute(interaction) {
        // Send the help embed as a reply to the interaction
        await interaction.reply({ embeds: [helpEmbed()], ephemeral: true });
    }
};

