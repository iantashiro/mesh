const { EmbedBuilder } = require('discord.js');

module.exports = gameBoardEmbed = (gamestate) => {
    // Safely get all required values with defaults
    const board = gamestate.board || {};
    const ruleset = board.fascistRuleset || [];
    const factionCount = gamestate.factionCount || { fascist: 0, liberal: 0 };

    // Safe array generation
    const fascistBoard = Array.from({ length: 6 }, (_, i) =>
        i < (board.fascistOnBoard || 0) ? '🟥' :
            ruleset[i] ? `**[${ruleset[i]}]**` : '❓'
    ).join(' ');

    const liberalBoard = Array.from({ length: 5 }, (_, i) =>
        i < (board.liberalOnBoard || 0) ? '🟦' : '**[ + ]**'
    ).join(' ');

    const failedVotes = Array.from({ length: 3 }, (_, i) =>
        i < (board.resetCounters || 0) ? '▫' : '▪️'
    ).join(' ');

    const lessThanFivePlayers = gamestate.players.length <= 5;
    const playerList = (gamestate.playerOrder || []).map(p => {
        if (!p) return "Unknown";
        const name = (p.nickname || p.user?.username || p.tag || "Unknown").slice(0, 15);
        const prefix =
            (gamestate.president?.id === p.id) ? '👑 ' :
                (gamestate.chancellorCandidate?.id === p.id) ? '🎩 ' :
                    (gamestate.lastChancellor?.id === p.id || 
                     (gamestate.lastPresident?.id === p.id && !lessThanFivePlayers)) ? '❌ ' : '';
        return prefix + name;
    }).join(', ');

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Game State')
        .addFields(
            {
                name: 'Board',
                value: `Fascist - ${fascistBoard}\nLiberal - ${liberalBoard}\nFailed Votes - ${failedVotes}`,
                inline: true
            },
            {
                name: 'Deck',
                value: `Cards Left: **${gamestate.deck?.length || 0}**\nCards Drawn: **${(gamestate.discard?.liberal || 0) + (gamestate.discard?.fascist || 0)}**`,
                inline: true
            },
            {
                name: 'Player Order',
                value: `\`\`\`diff\n${playerList}\`\`\``,
                inline: false
            }
        )
        .setFooter({
            text: `Stage: ${gamestate.gameStage || 'Unknown'} | ` +
                `Factions: ${factionCount.fascist}F ${factionCount.liberal}L`
        });
};