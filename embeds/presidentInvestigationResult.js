const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = presidentInvestigateResult = (target) => new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`${target.username.slice(0, 1).toUpperCase() + target.username.slice(1).toLowerCase()} is a ${target.role == "L" ? "Liberal" : "Fascist"}`);

