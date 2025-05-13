const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear_channel')
        .setDescription('Deletes all messages in the current channel'),

    async execute(interaction) {
        const moderatorRole = interaction.guild.roles.cache.find(
            role => role.name.toLowerCase() === 'moderator'
        );

        if (!moderatorRole || !interaction.member.roles.cache.has(moderatorRole.id)) {
            return await interaction.reply({
                content: '❌ You need the Moderator role to use this command.',
                flags: MessageFlags.Ephemeral
            });
        }


        const channel = interaction.channel;

        await interaction.reply({
            content: '🧹 Clearing messages...',
            flags: MessageFlags.Ephemeral
        });

        try {
            let fetched;
            do {
                fetched = await channel.messages.fetch({ limit: 100 });
                await channel.bulkDelete(fetched, true);
            } while (fetched.size >= 2);

            await interaction.editReply({
                content: '✅ Channel cleared.'
            });
        } catch (error) {
            console.error('Failed to clear channel:', error);
            await interaction.editReply({
                content: '❌ Failed to clear the channel. Make sure I have permission.'
            });
        }
    }
};
