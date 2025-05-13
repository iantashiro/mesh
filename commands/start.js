const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionFlagsBits } = require('discord.js');

/** Embeds */
const startEmbed = require("../embeds/startEmbed");
const lobbyEmbed = require("../embeds/lobbyEmbed");
const renderGameStateEmbed = require("../embeds/gametableEmbed");
const liberalRoleEmbed = require('../embeds/liberalRoleEmbed');
const fascistRoleEmbed = require('../embeds/fascistRoleEmbed');
const hitlerRoleEmbed = require('../embeds/hitlerRoleEmbed');

const Game = require('../game');

const createLobbyEmbed = (client, author, hostChannel, playerlist, debug) => {
    const lobbyMessage = lobbyEmbed(author, playerlist);

    hostChannel.send({ embeds: [lobbyMessage] })
        .then(async message => {
            console.log('Lobby message sent');
            await message.react('👍');
            console.log('👍 reaction added');

            // Collect any emoji reaction, from non-bot users
            const filter = (reaction, user) => !user.bot;

            const collector = message.createReactionCollector({
                filter,
                dispose: true,
            });

            const updatePlayerList = async () => {
                const thumbsUp = message.reactions.cache.get('👍');
                if (thumbsUp) {
                    const users = await thumbsUp.users.fetch();
                    playerlist = await Promise.all(
                        users
                            .filter(u => !u.bot)
                            .map(async u => await hostChannel.guild.members.fetch(u.id))
                    );
                } else {
                    playerlist = [];
                }

                await message.edit({ embeds: [lobbyEmbed(author, playerlist)] });

                if (playerlist.length >= 5) {
                    if (!message.reactions.cache.has('✅')) {
                        await message.react('✅').catch(() => { });
                    }
                } else {
                    const check = message.reactions.cache.get('✅');
                    if (check) await check.remove().catch(() => { });
                }
            };

            collector.on('collect', async (reaction, user) => {
                if (reaction.emoji.name === '✅' && user.id === author.id && playerlist.length >= 5) {
                    console.log('Starting game...');
                    await message.delete();
                    gameStart(client, author, hostChannel, playerlist, debug);
                }

                if (reaction.emoji.name === '👍') {
                    await updatePlayerList();
                }
            });

            collector.on('remove', async (reaction, user) => {
                if (reaction.emoji.name === '👍') {
                    await updatePlayerList();
                }
            });
        })
        .catch(err => {
            console.error('Error sending lobby message:', err);
        });
};


const gameStart = (client, author, hostChannel, players, debug) => {
    const newGame = new Game(client, author, hostChannel, players, debug);
    console.log('New game started:');

    const liberals = newGame.getLiberalPlayers();
    const fascists = newGame.getFascistPlayers();

    // DM each player their role
    for (const p of liberals) {
        p.send('-----------------------------------------------------');
        // Ensure liberal role embed is sent properly with potential attachment
        const { embed: liberalEmbed, file: liberalFile } = liberalRoleEmbed(p);
        p.send({ embeds: [liberalEmbed], files: [liberalFile] });
    }

    for (const p of fascists) {
        p.send('-----------------------------------------------------');
        if (p.username !== newGame.hitler.username) {
            const { embed: fascistEmbed, file: fascistFile } = fascistRoleEmbed(p, fascists, newGame.hitler);
            p.send({ embeds: [fascistEmbed], files: [fascistFile] });
        } else {
            const { embed: hitlerEmbed, file: hitlerFile } = hitlerRoleEmbed(p, fascists, newGame.hitlerKnows);
            p.send({ embeds: [hitlerEmbed], files: [hitlerFile] });
        }
    }

    renderGameStateEmbed(author, hostChannel, newGame);
};

module.exports = {
    // Slash command definition: /start
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Starts a Secret Hitler game')
        .addBooleanOption(option =>
            option.setName('debug')
                .setDescription('Control all 5 players from your account (debug mode)')
                .setRequired(false)
        ),

    // This function runs when the slash command is triggered
    async execute(interaction, client) {
        console.log('Slash command /start triggered');

        const author = interaction.guild.members.cache.get(interaction.user.id);
        let hostName = (author.nickname || author.user.username).replace(/\s+/g, '-');

        // Check if the author has the "Host" role
        const hostRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'host');
        if (!hostRole || !interaction.member.roles.cache.has(hostRole.id)) {
            return await interaction.reply({
                content: '❌ You need the **Host** role to start a game.',
                flags: MessageFlags.Ephemeral
            });
        }

        const hostChannelName = `${hostName}-sh`;

        await interaction.deferReply();

        let hostChannel = interaction.guild.channels.cache.find(
            c => c.name === hostChannelName
        );

        if (!hostChannel) {
            try {
                hostChannel = await interaction.guild.channels.create({
                    name: hostChannelName,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.AddReactions
                            ]
                        }
                    ]
                });

                await interaction.editReply({
                    content: `Game lobby created: ${hostChannel}`
                });

                // Add debug mode check
                const debug = interaction.options.getBoolean('debug') || false;

                if (debug) {
                    console.log('Debug mode enabled');
                    const playerlist = generateTestPlayers(interaction.user);
                    gameStart(client, author, hostChannel, playerlist, debug);
                } else {
                    createLobbyEmbed(client, author, hostChannel, [], debug);
                }

            } catch (error) {
                console.error('Failed to create channel:', error);
                await interaction.editReply({
                    content: 'Unable to create game channel. Check my permissions.'
                });
            }
        } else {
            await interaction.editReply({ content: 'Game already started!', ephemeral: true });

            // Create a lobby if the channel exists
            const debug = interaction.options.getBoolean('debug') || false;

            if (debug) {
                const playerlist = generateTestPlayers(interaction.user);
                gameStart(client, author, hostChannel, playerlist, debug);
            } else {
                createLobbyEmbed(client, author, hostChannel, []), debug;
            }
        }
    }
};

function generateTestPlayers(user, guild, count = 5) {
    return Array.from({ length: count }, (_, i) => ({
        id: `${user.id}-${i + 1}`,
        tag: `${user.username || 'TestUser'} [${i + 1}]`,
        realUser: user,
        nickname: `Player ${i + 1}`,
        isTestPlayer: true,
        send: async (message) => {
            if (!message) {
                console.error(`⚠️ Tried to send empty message to ${user.username || 'TestUser'}`);
                return;
            }
            //console.log(`📩 Message to ${user.username || 'TestUser'}:`, typeof message === 'object' ? JSON.stringify(message, null, 2) : message);
        }
    }));
}
