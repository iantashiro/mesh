const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = topThreeNotifications = (gamestate, edited) => {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(edited ? `President ${gamestate.president.username} has been shown the **Top 3 Policies** on the deck.` : 'A Presidential Event has been triggered!')
        .setDescription(`${gamestate.president.username}, the cards have been sent via ${gamestate.client.user.username}`);
};

