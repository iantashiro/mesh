const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = topThreeCardsEmbed = (gamestate) => {
    let topCards = gamestate.deck.slice(0, 3);

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Top three cards of the deck!`)
        .addFields(
            topCards.map((c, i) => {
                return {
                    name: `Card ${i + 1}: ${c == "L" ? "Liberal" : "Fascist"}`,
                    value: c != "L" ? '🟥' : '🟦',
                    inline: true
                };
            })
        );
};

