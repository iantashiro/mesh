const { EmbedBuilder } = require('discord.js');

module.exports = whichCardEmbed = (isLiberal) => {
    const cardType = isLiberal ? 'liberal' : 'fascist';
    const cardFile = `${cardType}_card.png`;

    // Return both the embed and files configuration
    return {
        embed: new EmbedBuilder()
            .setColor(isLiberal ? 0x3498db : 0xe74c3c)
            .setTitle(`${isLiberal ? 'A Liberal Card was Placed' : 'A Fascist Card was Placed'}`)
            .setImage(`attachment://${cardFile}`)
            .setThumbnail(`attachment://${cardFile}`),
        files: [{
            attachment: `./img/${cardFile}`,
            name: cardFile
        }]
    };
};