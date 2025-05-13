const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = function dmVoteChancellorEmbed(gamestate, chancellorNominee, player) {
    let areBothFascists =
        chancellorNominee?.role === "F" &&
        player?.role === "F" &&
        chancellorNominee?.id !== player?.id;

    let embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Vote Ballot')
        .addFields([
            {
                name: 'Presidential Candidate',
                value: String(gamestate.president?.username ?? 'Unknown'),
                inline: true,
            },
            {
                name: 'Chancellor Candidate',
                value: String(chancellorNominee?.username ?? 'Unknown'),
                inline: true,
            }
        ])
        .setDescription('✅ - Yes    ❌ - No')
        .setThumbnail('https://i.imgur.com/1jE7uUZ.jpg');

    if (areBothFascists) {
        embed.addFields([
            {
                name: `Remember. ${chancellorNominee.username} is also a fascist.`,
                value: '😈'
            }
        ]);
    }

    if (gamestate.board?.resetCounters > 0) {
        embed.addFields([
            {
                name: 'Reset Counters:',
                value: String(gamestate.board.resetCounters),
                inline: true
            }
        ]);
    }

    return embed;
};
