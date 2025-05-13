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

module.exports = chancellorPickingEmbed = (chancellorNominee, supporters, opposers, chancellorChannel) => {
    let description =
        `**Chancellor ${getDisplayName(chancellorNominee)} has been sent **2 Policy Cards** in <#${chancellorChannel.id}>.\n\n`; +
            `The ** Policy ** they choose will be placed down on the board.\n`;

    // Add voting results to the description
    description += `**Ja! (${supporters.length})** ✅\n` +
        `${supporters.length > 0 ? supporters.join('\n') : 'Nobody voted ✅'}\n\n` +
        `**Nein! (${opposers.length})** ❌\n` +
        `${opposers.length > 0 ? opposers.join('\n') : 'Nobody voted ❌'}`;

    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('**Chancellor choosing policy...**')
        .setDescription(description);
};
