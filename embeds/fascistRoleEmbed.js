const { AttachmentBuilder, EmbedBuilder } = require('discord.js');  // Import correct classes

// Create the attachment for the image
const fascistImg = new AttachmentBuilder('./img/fascist_role.jpg', { name: 'fascist_role.jpg' });

module.exports = fascistRoleEmbed = (player, fascists, hitler) => {
    // Create the embed for the fascist role
    const embed = new EmbedBuilder()
        .setColor('#ff3300')
        .setTitle(`Hello ${player.username}! You are a fascist.`)
        .setDescription(`Escort Hitler to the throne and defeat those filthy liberals.`)
        .setImage('attachment://fascist_role.jpg')  // Use the correct attachment reference
        .addFields(
            { name: "Hitler: ", value: hitler.username, inline: false }
        );

    // If there are other fascists, add their names
    if (fascists.length > 2) {
        let otherFascists = fascists.filter(f => f.username != hitler.username && f.username != player.username)
            .map(f => f.username).join(', ');
        embed.addFields(
            { name: "Fellow Fascists: ", value: otherFascists, inline: false }
        );
    }

    // Return the embed along with the attachment
    return { embed, file: fascistImg };
};
