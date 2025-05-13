const { EmbedBuilder } = require('discord.js');

module.exports = notifyChancellorCandidate = (gamestate, chancellorCandidate, votedPlayers, edited) => {
    const getDisplayName = (player) => {
        if (player.isTestPlayer) {
            return player.nickname || player.tag || 'Unknown';
        } else {
            return (player.nickname || player.user?.username || 'Unknown').split(' ').join('-');
        }
    };

    // Get voted and not-voted players (using player objects directly)
    let voted = votedPlayers.map(v => getDisplayName(v));
    let notVoted = gamestate.players
        .filter(p => !votedPlayers.some(v => v.id === p.id))
        .map(p => getDisplayName(p));


    // Create the embed message
    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`Voting Time`)
        .setDescription(
            `Vote in this election via ${gamestate.client.user}. \n*Everyone must vote once.*\n\n` +
            `*...at least **${Math.floor(gamestate.players.length / 2) + 1}** ✅ votes are needed for election.*\n`
        )
        .addFields(
            {
                name: 'Presidential Candidate',
                value: String(getDisplayName(gamestate.president.member || gamestate.president)),
                inline: true
            },
            {
                name: 'Chancellor Candidate',
                value: String(getDisplayName(chancellorCandidate.member || chancellorCandidate)),
                inline: true
            },
            {
                name: '\u200B',
                value: '\u200B',
                inline: false
            },
            {
                name: 'Who has voted?',
                value: `*${voted.length === 0 ? 'Nobody has voted yet' : voted.join('\n')}*`,
                inline: true
            },
            {
                name: 'Who still needs to vote?',
                value: `*${voted.length === gamestate.players.length ? 'Everybody has voted!' : notVoted.join('\n')}*`,
                inline: true
            }
        );
}
