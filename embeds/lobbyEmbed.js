const { EmbedBuilder } = require('discord.js');

module.exports = function lobbyEmbed(author, playerlist) {
    const names = playerlist.map(p => p.displayName).join('\n') || 'No players yet';

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎲 Secret Hitler Lobby')
        .setDescription(`Game hosted by **${author.nickname}**\nReact with 👍 to join.`)
        .addFields({ name: 'Current Players', value: names });
};

