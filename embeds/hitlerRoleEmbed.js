const { EmbedBuilder, AttachmentBuilder } = require('discord.js'); // Add AttachmentBuilder

/** secret-hitler-img */

module.exports = hitlerRoleEmbed = (player, fascists, hitlerKnows) => {
    const file = new AttachmentBuilder('./img/hitler_role.jpg');

    let embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`My Fuhreh, ${player.username}.`)
        .addFields(
            {
                name: 'The traitors are everywhere. . .',
                value: 'Rally your hidden comrades. \n Your victory is nigh!',
                inline: true
            }
        )
        .setImage('attachment://hitler_role.jpg'); // reference file by name

    if (hitlerKnows && fascists.length > 1) {
        let otherFascists = fascists.filter(f => f.username != player.username).join(', ');
        embed.addFields({ name: "Fellow Fascists: ", value: otherFascists, inline: false });
    } else if (fascists.length - 1 > 0) {
        embed.addFields({ name: `Number of disguised fascists: `, value: `${fascists.length - 1}` });
    }

    // Return both
    return { embed, file };
};
