const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = returnEmbed = (channel) => new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Thanks!`)
    .setDescription(`Return to the game channel - ${channel}`);

