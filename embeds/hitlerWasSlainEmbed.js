const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = hitlerWasSlain = (gamestate) => new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Hitler was slain! Shot by ${gamestate.president.name}.`)
    .setDescription(`The Fascists have lost their leader, the liberals have won!`)
    .addFields(
        { name: "Players in the Game", value: `${gamestate.players.length} players currently in the game.` }
    );

