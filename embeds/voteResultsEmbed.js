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

module.exports = voteResultsEmbed = (gamestate, chancellorNominee, supporters, opposers, voteSuccess, presidentChannel) => {
    // Create the base message content
    let description;
    if (voteSuccess) {
        description =
            `**3 Policies** have been sent to President ${getDisplayName(gamestate.president)} in <#${presidentChannel.id}>.\n` +
            `**They may discard one policy**, the other two will be sent to ${getDisplayName(chancellorNominee)}.\n\n`;
    } else {
        description = `**The vote was a failure!**\n\n` +
            `*Aww shucks*.\n` +
            `The *Failed Votes* counter increases by one to ${gamestate.board.resetCounters}\n\n`;
    }

    // Add voting results to the description
    description += `**Ja! (${supporters.length})** ✅\n` +
        `${supporters.length > 0 ? supporters.join('\n') : 'Nobody voted ✅'}\n\n` +
        `**Nein! (${opposers.length})** ❌\n` +
        `${opposers.length > 0 ? opposers.join('\n') : 'Nobody voted ❌'}`;

    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(voteSuccess ? 'Government Approved!' : 'Vote Failed!')
        .setDescription(description);
};