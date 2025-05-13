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

const emojibank = ['1️⃣', '2️⃣'];

module.exports = function sendChancellorCardsEmbed(chancellor, cards) {
    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`*Choose a Policy*, ${getDisplayName(chancellor)}`)
        .setDescription('Please select **one** of the following policies to be *placed on the board*.')
        .addFields(
            cards.map((c, i) => ({
                name: `Card ${i + 1}: ${c === "L" ? "Liberal 🟦" : "Fascist 🟥"}`,
                value: emojibank[i],
                inline: true
            }))
        );
};
