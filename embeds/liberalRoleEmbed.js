const { AttachmentBuilder, EmbedBuilder } = require('discord.js');  // Import correct classes

// Create the attachment for the image
const liberalImg = new AttachmentBuilder('./img/liberal_role.jpg', { name: 'liberal_role.jpg' });

module.exports = liberalRoleEmbed = (player) => {
    // Create the embed and attach the image
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Protect us, ${player.username}!`)
        .setDescription(`Hitler and his fascists have blended in. \n They're after you.`)
        .setImage('attachment://liberal_role.jpg')  // Use the correct attachment reference
        .addFields({ name: 'Current Players', value: '3 players in the game' });  // Example field for number of players

    // Return the embed along with the attachment
    return { embed, file: liberalImg };
};
