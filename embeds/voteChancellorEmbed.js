const { EmbedBuilder } = require('discord.js');

const emojibank = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = createVoteChancellorEmbed = (gamestate) => {
    const candidates = gamestate.players
        .filter(p => p.id !== gamestate.president.id && p.id !== gamestate.lastChancellor.id)
        .slice(0, emojibank.length); // limit to 10 to match emoji count

    const fields = candidates.map((p, i) => ({
        name: p.nickname ?? p.username, // Use nickname if available, otherwise fallback to username
        value: emojibank[i],
        inline: true
    }));

    const descriptionParts = [
        `*${gamestate.president.nickname ?? gamestate.president.username ?? 'Unknown'}* **is running for President**`,
        `They may select a **Chancellor** to run with`,
        ''
    ];

    if (
        gamestate.lastChancellor?.id !== undefined &&
        gamestate.lastChancellor.id !== gamestate.president.id
    ) {
        let restriction = `**${gamestate.lastChancellor.nickname ?? gamestate.lastChancellor.username ?? 'Unknown'}`;
        if (gamestate.players.length > 5) {
            restriction += ` and ${gamestate.lastPresident?.nickname ?? gamestate.lastPresident?.username ?? 'Unknown'}`;
        }
        restriction += ` may not be re-elected.**`;
        descriptionParts.push(restriction);
    }

    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('*Presidential Election*')
        .setDescription(descriptionParts.join('\n'))
        .addFields(fields);
};
