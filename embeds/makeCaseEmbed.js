const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = makeYourCaseEmbed = (gamestate, chancellorCandidate) => {
    // Prepare the player information as strings to display in the embed
    const presidentName = gamestate.president.username || gamestate.president.tag || "Unknown President";
    const chancellorName = chancellorCandidate.username || chancellorCandidate.tag || "Unknown Chancellor";

    // Ensure all values are strings before passing to the embed
    const presidentNameStr = typeof presidentName === 'string' ? presidentName : `${presidentName}`;
    const chancellorNameStr = typeof chancellorName === 'string' ? chancellorName : `${chancellorName}`;
    const playersCount = typeof gamestate.players.length === 'number' ? gamestate.players.length : 0;

    // Create the embed message using EmbedBuilder
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle("Voting has begun")
        .setDescription(`*The ballot is as follows...*`)
        .addFields(
            { name: 'Presidential Candidate', value: presidentNameStr, inline: true },
            { name: 'Chancellor Candidate', value: chancellorNameStr, inline: true },
            { name: 'Number of Players', value: `${playersCount} players currently in the game.`, inline: true }
        );
};
