const { EmbedBuilder } = require('discord.js');

/** secret-hitler-img */

module.exports = createStartEmbed = (author, channel) => new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Secret Hitler Starting!`)
    .setAuthor({ name: author.username, iconURL: 'https://i.imgur.com/wSTFkRM.png', url: 'https://discord.js.org' })
    .setDescription(`A secret hitler game is starting in the ${channel} text channel. Join the lobby and the host will begin!`)
    .setThumbnail('https://i.imgur.com/1jE7uUZ.jpg');

