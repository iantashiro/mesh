const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

var emojibank = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports = presidentInvestigationEmbed = (gamestate, players, edited, target = { username: null }) => {
    let embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(!edited ? `Presidential Investigation Begins` :
            `President ${gamestate.president.username} has chosen to investigate ${target.username}'s *faction*`)
        .setDescription(`${!edited ?
            `President ${gamestate.president.username} you have been granted the right to \n discover **one** player's secret **faction**\n` :
            `${target.username} was investigated. \n\n Their faction has been disclosed to President ${gamestate.president.username} via ${gamestate.client.user.username}.`}`);

    if (!edited) {
        embed.addFields(
            players.map((p, i) => {
                return {
                    name: p.username,
                    value: emojibank[i],
                    inline: true
                };
            })
        );
    }

    return embed;
};

