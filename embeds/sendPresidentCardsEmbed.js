const { EmbedBuilder } = require('discord.js');

function getDisplayName(player) {
    return (
        player.nickname ||
        player.displayName ||
        player.user?.username ||
        player.tag ||
        player.id ||
        'Unknown Player'
    );
}

var emojibank = ['1️⃣', '2️⃣', '3️⃣'];

module.exports = sendPresidentCardsEmbed = (gamestate, cards) => {
    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`*Discard* One Policy`)
        .setDescription(`The *two other policies* shall be sent to **${getDisplayName(gamestate.chancellorCandidate)}** for final *placement*.`) 
        .addFields(
            cards.map((c, i) => {
                return {
                    name: `Card ${i + 1}: ${c === "L" ? "Liberal 🟦" : "Fascist 🟥"}`,
                    value: emojibank[i],
                    inline: true
                };
            })
        );
}

