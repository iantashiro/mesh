const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = gameEndResults = (gamestate, winner) => {
    let winningTeam = winner == "L" ? "Liberals" : "Fascists";

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${winningTeam + ' have won!'}`)
        .addFields(
            { name: 'Liberals', value: gamestate.playerInfo.liberals.map(l => l.username).join('\n'), inline: true },
            { name: 'Fascists', value: gamestate.playerInfo.fascists.map(f => f.username).join('\n'), inline: true }
        )
        .setDescription(`*${gamestate.hitler.username} was Hitler!*`);
}

