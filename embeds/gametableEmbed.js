const Discord = require('discord.js');
const { ChannelType, PermissionsBitField } = require('discord.js');
const createVoteChancellorEmbed = require('../embeds/voteChancellorEmbed');
const notifyChancellorCandidate = require('../embeds/notifyChancellorCand');
const voteResultsEmbed = require('../embeds/voteResultsEmbed');
const sendPresidentCardsEmbed = require('./sendPresidentCardsEmbed');
const sendChancellorCardsEmbed = require('../embeds/sendChancellorCardsEmbed');
const dmVoteChancellorEmbed = require('../embeds/dmVoteChancellorEmbed');
const roleNotificationEmbed = require('../embeds/roleNotificationEmbed');
const gameBoardEmbed = require('../embeds/boardEmbed');
const makeCaseEmbed = require('../embeds/makeCaseEmbed');
const chancellorPickingEmbed = require('../embeds/chancellorPickingEmbed');
const whichCardEmbed = require('../embeds/whichCardPlacedEmbed');
const gameEndEmbed = require('../embeds/gameEndResultsEmbed');
const presidentInvestigationEmbed = require('../embeds/presidentInvestigateEmbed');
const presidentInvestigationResult = require('../embeds/presidentInvestigationResult');
const topThreeCardsEmbed = require('../embeds/topThreeCardsEmbed');
const topThreeNotifications = require('../embeds/topThreeNotifications');
const presidentPickingEmbed = require('../embeds/presidentPickingNotification');
const presidentKillNotifyEmbed = require('../embeds/presidentKillNotifyEmbed');
const hitlerWasSlain = require('../embeds/hitlerWasSlainEmbed');
const returnEmbed = require('../embeds/returnToChannelEmbed');
const gamestages = require('../data/gamestages');

function getDisplayName(player) {
    return (
        player.nickname ||                         // Guild nickname (top priority)
        player.displayName ||                      // General display name
        player.realUser?.username ||               // Debug mode fallback
        player.user?.username ||                   // Real user fallback
        player.tag ||                              // Tag (e.g. "username#1234")
        player.id ||                               // At worst, show ID
        'Unknown Player'
    );
}

/** secret-hitler-img */

module.exports = renderGameStateEmbed = (author, hostChannel, gamestate) => {
    try {
        const gbEmbed = gameBoardEmbed(gamestate);
        const rnEmbed = roleNotificationEmbed(gamestate, false);

        hostChannel.send({ embeds: [rnEmbed] })
            .then(m => {
                setTimeout(function () {
                    m.edit({ embeds: [roleNotificationEmbed(gamestate, true)] })
                        .catch(err => console.error('Error editing message:', err));
                }, 2000);

                // 3. After 5s, send game board and store as boardState
                setTimeout(async () => {
                    try {
                        const boardMessage = await hostChannel.send({ embeds: [gbEmbed] });
                        gamestate.boardState = boardMessage; // embed clearly as boardState
                        voteForChancellor(gamestate); // Proceed to next game phase
                    } catch (err) {
                        console.error('❌ Failed to send game board:', err);
                    }
                }, 1000);
            })
            .catch(err => console.error('Error sending role notification embed:', err));

    } catch (err) {
        console.error('Synchronous error caught:', err);
    }
}


var emojibank = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

const voteForChancellor = async (gamestate) => {
    const voteEmbed = createVoteChancellorEmbed(gamestate);
    const voteMsg = await gamestate.hostChannel.send({ embeds: [voteEmbed] });

    const lessThanFivePlayers = gamestate.players.length <= 5;
    const candidates = gamestate.players.filter(p =>
        p.id !== gamestate.president.id &&
        p.id !== gamestate.lastChancellor.id &&
        (p.id !== gamestate.lastPresident.id || lessThanFivePlayers)
    );

    if (candidates.length > emojibank.length) {
        console.error('Not enough emojis in emojibank for the number of candidates');
        return;
    }

    // Add reaction emojis to allow nomination
    await Promise.all(
        candidates.map((_, i) =>
            voteMsg.react(emojibank[i]).catch(err => console.error('Error reacting:', err))
        )
    );

    const filter = (user) => {
        return !user.bot && (gamestate.debugMode || gamestate.president.id === user.id);
    };

    const collector = voteMsg.createReactionCollector({ filter, max: 1 });

    collector.on('collect', async (reaction, user) => {
        const nomineeIndex = emojibank.findIndex(e => e === reaction.emoji.name);
        const chancellorAppointed = candidates[nomineeIndex];
        await voteMsg.delete();

        gamestate.chancellorCandidate = chancellorAppointed;
        gamestate.gameStage = gamestages.CHVOTE;
        try {
            await gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
        } catch (err) {
            console.error('Failed to edit board embed:', err);
            // Resend new board if edit fails
            gamestate.boardState = await gamestate.hostChannel.send({
                embeds: [gameBoardEmbed(gamestate)]
            });
        }

        // Begin public voting
        let yesVotes = 0;
        let noVotes = 0;
        let votedPlayers = [];
        let supporters = [];
        let opposers = [];

        const votingEmbed = await gamestate.hostChannel.send({
            embeds: [notifyChancellorCandidate(gamestate, chancellorAppointed, votedPlayers, { yesVotes, noVotes })]
        });

        await votingEmbed.react('✅');
        await votingEmbed.react('❌');

        const voteFilter = (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) &&
                (gamestate.debugMode || gamestate.players.some(p => p.id === user.id)) &&
                !votedPlayers.some(v => v.id === user.id);
        };

        const voteCollector = votingEmbed.createReactionCollector({ filter: voteFilter, time: 600000 });

        voteCollector.on('collect', (reaction, user) => {
            if (user.bot) return; // Skip bot reactions

            const votedYes = reaction.emoji.name === '✅';
            user.lastVote = votedYes ? 'yes' : 'no';

            votedPlayers.push(user);
            if (votedYes) {
                yesVotes++;
                supporters.push(user);
            } else {
                noVotes++;
                opposers.push(user);
            }

            votingEmbed.edit({
                embeds: [notifyChancellorCandidate(gamestate, chancellorAppointed, votedPlayers, { yesVotes, noVotes })]
            }).catch(console.error);

            if (gamestate.debugMode) {
                voteCollector.stop();
            } else if (votedPlayers.length === gamestate.players.length) {
                voteCollector.stop();
            }
        });

        voteCollector.on('end', async () => {
            try {
                await votingEmbed.delete().catch(console.error);
            } catch (err) {
                console.error('Failed to delete voting embed:', err);
            }

            const voteSuccess = gamestate.debugMode
                ? votedPlayers.length > 0 && votedPlayers[0].lastVote === 'yes'
                : yesVotes >= Math.floor(gamestate.players.length / 2) + 1;

            if (voteSuccess) {
                gamestate.gameStage = gamestages.PCARDS;
                gamestate.board.resetCounters = 0;

                let presidentChannel, chancellorChannel;

                try {
                    const hostUser = gamestate.hostUser ?? gamestate.author;
                    const hostMember = await gamestate.hostChannel.guild.members.fetch(hostUser.id);

                    const presidentMember = gamestate.debugMode ? hostMember : await gamestate.hostChannel.guild.members.fetch(gamestate.president.id);
                    const chancellorMember = gamestate.debugMode ? hostMember : await gamestate.hostChannel.guild.members.fetch(chancellorAppointed.id);

                    const guild = gamestate.hostChannel.guild;
                    const existingPresidentChannel = guild.channels.cache.find(c => c.name === ('president-selection') && c.type === ChannelType.GuildText);
                    const existingChancellorChannel = guild.channels.cache.find(c => c.name === ('chancellor-selection') && c.type === ChannelType.GuildText);

                    presidentChannel = existingPresidentChannel || await guild.channels.create({
                        name: 'president-selection',
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            {
                                id: presidentMember,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.AddReactions
                                ]
                            },
                            {
                                id: gamestate.client.user,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ManageMessages,
                                    PermissionsBitField.Flags.ManageChannels
                                ]
                            }
                        ],
                        reason: 'President policy selection'
                    });

                    chancellorChannel = existingChancellorChannel || await guild.channels.create({
                        name: 'chancellor-selection',
                        type: ChannelType.GuildText,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone,
                                deny: [PermissionsBitField.Flags.ViewChannel]
                            },
                            {
                                id: chancellorMember,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.AddReactions
                                ]
                            },
                            {
                                id: gamestate.client.user,
                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ManageMessages,
                                    PermissionsBitField.Flags.ManageChannels
                                ]
                            }
                        ],
                        reason: 'Chancellor policy selection'
                    });


                    try {
                        // Edit the existing board message
                        await gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                    } catch (err) {
                        console.error('❌ Failed to edit board embed:', err);
                        // If editing fails (likely message was deleted), send a new one
                        gamestate.boardState = await gamestate.hostChannel.send({ embeds: [gameBoardEmbed(gamestate)] });
                    }

                    const voteMsg = await gamestate.hostChannel.send({
                        embeds: [voteResultsEmbed(
                            gamestate, chancellorAppointed,
                            supporters, opposers, true,
                            presidentChannel
                        )]
                    });
                    setTimeout(() => {
                        voteMsg.edit({
                            embeds: [voteResultsEmbed(
                                gamestate, chancellorAppointed,
                                supporters, opposers, true,
                                presidentChannel
                            )]
                        });
                        sendPresidentCards(
                            gamestate, chancellorAppointed, voteMsg,
                            supporters, opposers,
                            presidentChannel, chancellorChannel
                        );
                        console.log('Cards sent to president')
                    }, 1000);

                } catch (error) {
                    console.error("Detailed channel creation error:", error);
                    if (presidentChannel) await presidentChannel.delete().catch(console.error);
                    if (chancellorChannel) await chancellorChannel.delete().catch(console.error);
                    throw new Error("Could not create private selection channels");
                }
            } else {
                gamestate.board.resetCounters++;
                gamestate.chancellorCandidate = null;
                gamestate.gameStage = gamestages.PCHOOSE;
                gamestate.presidentIndex = (gamestate.presidentIndex + 1) % gamestate.playerOrder.length;
                gamestate.president = gamestate.playerOrder[gamestate.presidentIndex];

                const voteMsg = await gamestate.hostChannel.send({
                    embeds: [voteResultsEmbed(gamestate, chancellorAppointed, supporters, opposers, false)]
                });

                setTimeout(async () => {
                    await voteMsg.delete();

                    if (gamestate.board.resetCounters === 3) {
                        gamestate.board.resetCounters = 0;
                        const chosenCard = gamestate.deck.shift();

                        if (chosenCard === 'L') {
                            gamestate.board.liberalOnBoard++;
                            const cardMsg = await gamestate.hostChannel.send(whichCardEmbed(true));
                            setTimeout(() => cardMsg.delete(), 3000);

                            if (gamestate.board.liberalOnBoard === 5) {
                                gamestate.hostChannel.send(gameEndEmbed(gamestate, 'L'));
                                await gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                                return;
                            }
                        } else if (chosenCard === 'F') {
                            gamestate.board.fascistOnBoard++;
                            const cardMsg = await gamestate.hostChannel.send(whichCardEmbed(false));
                            setTimeout(() => cardMsg.delete(), 3000);

                            if (gamestate.board.fascistOnBoard === 6) {
                                gamestate.hostChannel.send(gameEndEmbed(gamestate, 'R'));
                                await gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                                return;
                            }
                        }
                    }

                    await gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                    voteForChancellor(gamestate);
                }, 4000);
            }
        });
    });
};

const sendPresidentCards = async (
    gamestate, chancellorAppointed, voteEmbed,
    supporters, opposers,
    presidentChannel, chancellorChannel
) => {
    let cards = gamestate.deck.splice(0, 3);

    if (gamestate.deck.length <= 2) {
        gamestate.deck.cards.forEach(c => {
            if (c == "L") {
                gamestate.discard.liberal++;
            } else {
                gamestate.discard.fascist++;
            }
        })

        gamestate.deck = gamestate.shuffleDeck(gamestate.discard.liberal, gamestate.discard.fascist);
    }

    cards.forEach(c => {
        if (c == "L") {
            gamestate.discard.liberal++;
        } else {
            gamestate.discard.fascist++;
        }
    });

    try {
        // Verify channels exist
        if (!presidentChannel?.deleted) {
            await presidentChannel.send({
                content: `${getDisplayName(gamestate.president)}, you have received 3 policies. React with the number of the policy you want to DISCARD.`,
                embeds: [sendPresidentCardsEmbed(gamestate, cards)]
            });

            const cardMessage = await presidentChannel.send("Please select one to discard:");
            await Promise.all([
                cardMessage.react('1️⃣'),
                cardMessage.react('2️⃣'),
                cardMessage.react('3️⃣')
            ]);

            const voteFilter = (reaction, user) =>
                ['1️⃣', '2️⃣', '3️⃣'].includes(reaction.emoji.name) &&
                (gamestate.debugMode || user.id === gamestate.president.id);

            const voteCollector = cardMessage.createReactionCollector({
                filter: voteFilter,
                max: 1
            });

            voteCollector.on('collect', async (reaction) => {
                const chosenIndex = ['1️⃣', '2️⃣', '3️⃣'].indexOf(reaction.emoji.name);
                const discardedCard = cards.splice(chosenIndex, 1)[0];

                await presidentChannel.send(
                    `You discarded policy ${chosenIndex + 1} (${discardedCard === "L" ? "Liberal" : "Fascist"})\n` +
                    `Return to the main game channel in <#${gamestate.hostChannel.id}>.`
                );

                // Pass both channels to sendChancellorCards
                await sendChancellorCards(
                    gamestate, chancellorAppointed, cards, voteEmbed,
                    supporters, opposers, chancellorChannel
                );
                console.log('Cards sent to chancellor')

                setTimeout(async () => {
                    try {
                        // 1. Clear messages
                        try {
                            const messages = await presidentChannel.messages.fetch({ limit: 100 });
                            if (messages.size > 0) {
                                await presidentChannel.bulkDelete(messages);
                                console.log(`Deleted ${messages.size} messages`);
                            }
                        } catch (fetchError) {
                            console.error('Error clearing president messages:', fetchError);
                        }

                        // 2. Remove permissions - Special handling for test players
                        try {
                            // Get the actual ID (remove -number suffix for test players)
                            const baseId = gamestate.president.isTestPlayer
                                ? gamestate.president.realUser.id
                                : gamestate.president.id;

                            // Validate ID format
                            if (!/^\d+$/.test(baseId)) {
                                throw new Error(`Invalid ID format: ${baseId}`);
                            }

                            // Check if permission exists
                            const existingPerms = presidentChannel.permissionOverwrites.cache.get(baseId);
                            if (existingPerms) {
                                await presidentChannel.permissionOverwrites.delete(baseId);
                                console.log(`Removed ${gamestate.president.username}'s access (ID: ${baseId})`);
                            } else {
                                console.log(`No permissions found for ${gamestate.president.username} (ID: ${baseId})`);
                            }
                        } catch (permError) {
                            console.error('Error removing president permissions:', permError);
                        }
                    } catch (mainError) {
                        console.error('Cleanup failed:', mainError);
                    }
                }, 10000);
            });
        }
    } catch (error) {
        console.error("Error in president card selection:", error);
        throw error;
    }
};


const sendChancellorCards = async (gamestate, chancellorAppointed, cards, currentEmbed, supporters, opposers, chancellorChannel) => {
    try {
        // Verify the channel exists and is accessible
        if (!chancellorChannel || chancellorChannel.deleted) {
            throw new Error("Invalid chancellor channel provided");
        }

        await currentEmbed.edit({
            embeds: [chancellorPickingEmbed(chancellorAppointed, supporters, opposers, chancellorChannel)]
        });

        // Send initial instructions to the provided channel
        await chancellorChannel.send({
            content: `${getDisplayName(chancellorAppointed)}, you have received 2 policies. React with the number of the policy you want to ENACT.`,
            embeds: [sendChancellorCardsEmbed(chancellorAppointed, cards)]
        });

        // Send cards and add reactions to the provided channel
        const cardMessage = await chancellorChannel.send("Please select one to enact:");
        await Promise.all([
            cardMessage.react('1️⃣'),
            cardMessage.react('2️⃣')
        ]);

        // Set up collector (no time limit)
        const voteFilter = (reaction, user) =>
            ['1️⃣', '2️⃣'].includes(reaction.emoji.name) &&
            (gamestate.debugMode || user.id === gamestate.chancellorCandidate.id);

        const voteCollector = cardMessage.createReactionCollector({
            filter: voteFilter,
            max: 1
        });

        voteCollector.on('collect', async (reaction) => {
            const chosenIndex = ['1️⃣', '2️⃣'].indexOf(reaction.emoji.name);
            const chosenCard = cards[chosenIndex];

            // Log the selection in the chancellor's channel
            await chancellorChannel.send(
                `You enacted policy ${chosenIndex + 1} (${chosenCard === "L" ? "Liberal" : "Fascist"})\n` +
                `Return to the main game channel in <#${gamestate.hostChannel.id}>.
            `);

            setTimeout(async () => {
                try {
                    // 1. Clear messages
                    try {
                        const messages = await chancellorChannel.messages.fetch({ limit: 100 });
                        if (messages.size > 0) {
                            await chancellorChannel.bulkDelete(messages);
                            console.log(`Deleted ${messages.size} messages`);
                        }
                    } catch (fetchError) {
                        console.error('Error clearing chancellor messages:', fetchError);
                    }
    
                    // 2. Remove permissions - Special handling for test players
                    try {
                        // Get the actual ID (remove -number suffix for test players)
                        const baseId = gamestate.chancellorCandidate.isTestPlayer
                            ? gamestate.chancellorCandidate.realUser.id
                            : gamestate.chancellorCandidate.id;
    
                        // Validate ID format
                        if (!/^\d+$/.test(baseId)) {
                            throw new Error(`Invalid ID format: ${baseId}`);
                        }
    
                        // Check if permission exists
                        const existingPerms = chancellorChannel.permissionOverwrites.cache.get(baseId);
                        if (existingPerms) {
                            await chancellorChannel.permissionOverwrites.delete(baseId);
                            console.log(`Removed ${gamestate.chancellorCandidate.username}'s access (ID: ${baseId})`);
                        } else {
                            console.log(`No permissions found for ${gamestate.chancellorCandidate.username} (ID: ${baseId})`);
                        }
                    } catch (permError) {
                        console.error('Error removing chancellor permissions:', permError);
                    }
                } catch (mainError) {
                    console.error('Cleanup failed:', mainError);
                }
            }, 10000);

            if (chosenCard == "L") {
                gamestate.board.liberalOnBoard++;
                const { embed, files } = whichCardEmbed(true);
                currentEmbed.edit({
                    embeds: [embed],
                    files: files
                })
                    .then(m => {
                        setTimeout(() => m.delete(), 3000);
                    })

                if (gamestate.board.liberalOnBoard == 5) { // liberals win!
                    gamestate.hostChannel.send(gameEndEmbed(gamestate, "L"));
                    gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                    return;
                }
            } else if (chosenCard == "F") {
                gamestate.board.fascistOnBoard++;
                const { embed, files } = whichCardEmbed(false);
                currentEmbed.edit({
                    embeds: [embed],
                    files: files
                })
                    .then(m => {
                        setTimeout(() => m.delete(), 3000);
                    })

                if (gamestate.board.fascistOnBoard == 6) {// fascists win!
                    gamestate.hostChannel.send(gameEndEmbed(gamestate, "F"));
                    gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
                    return;
                }

                let fascistEvent = gamestate.board.fascistRuleset[gamestate.board.fascistOnBoard - 1];
                let nonPresidents = gamestate.players.filter(p => p.id != gamestate.president.id);
                switch (fascistEvent) {
                    case ('  '):
                        break;
                    case ('PI'):
                        // current president investigates a player's identity
                        gamestate.hostChannel.send(presidentInvestigationEmbed(gamestate, nonPresidents, false))
                            .then(m => {
                                nonPresidents.forEach((p, i) => {
                                    m.react(emojibank[i]);
                                })

                                const voteFilter = (r, u) => emojibank.includes(r.emoji.name) && u.id == gamestate.president.id;
                                const votecollector = m.createReactionCollector(voteFilter, { max: 1 });

                                votecollector.on('collect', (r, u) => {
                                    let chosenIndex = emojibank.findIndex(num => num == r.emoji.name);
                                    let chosenUser = nonPresidents[chosenIndex];
                                    gamestate.president.send(presidentInvestigationResult(chosenUser));

                                    setTimeout(function () {
                                        m.edit(presidentInvestigationEmbed(gamestate, nonPresidents, true, chosenUser));
                                        setTimeout(function () {
                                            m.delete();
                                            resetRound(gamestate, chancellorAppointed);
                                        }, 3000)
                                    }, 1000)
                                })
                            });
                        return;
                    case ('PE'):
                        // current president gets to examine the top three cards
                        gamestate.hostChannel.send(topThreeNotifications(gamestate, false))
                            .then(m => {
                                gamestate.president.send(topThreeCardsEmbed(gamestate));
                                setTimeout(function () {
                                    m.edit(topThreeNotifications(gamestate, true));
                                    setTimeout(function () {
                                        m.delete();
                                        resetRound(gamestate, chancellorAppointed);
                                    }, 4000)
                                }, 3000)
                            });
                        return;
                    case ('PP'):
                        gamestate.hostChannel.send(presidentPickingEmbed(gamestate, nonPresidents, null, false))
                            .then(m => {
                                nonPresidents.forEach((p, i) => {
                                    m.react(emojibank[i]);
                                })

                                const voteFilter = (r, u) => emojibank.includes(r.emoji.name) && u.id == gamestate.president.id;
                                const votecollector = m.createReactionCollector(voteFilter, { max: 1 });

                                votecollector.on('collect', (r, u) => {
                                    let chosenIndex = emojibank.findIndex(num => num == r.emoji.name);
                                    let chosenUser = nonPresidents[chosenIndex];
                                    m.edit(presidentPickingEmbed(gamestate, nonPresidents, chosenUser, true));

                                    setTimeout(function () {
                                        m.delete();
                                        resetRound(gamestate, chancellorAppointed, chosenUser);
                                    }, 5000)
                                })
                            })
                        return;
                    case ('PK'):
                        gamestate.hostChannel.send(presidentKillNotifyEmbed(gamestate, nonPresidents, false))
                            .then(m => {
                                nonPresidents.forEach((p, i) => {
                                    m.react(emojibank[i]);
                                })

                                const voteFilter = (r, u) => emojibank.includes(r.emoji.name) && u.id == gamestate.president.id;
                                const votecollector = m.createReactionCollector(voteFilter, { max: 1 });

                                votecollector.on('collect', (r, u) => {
                                    let chosenIndex = emojibank.findIndex(num => num == r.emoji.name);
                                    let chosenUser = nonPresidents[chosenIndex];
                                    m.edit(presidentKillNotifyEmbed(gamestate, nonPresidents, true, chosenUser));

                                    if (chosenUser.id == gamestate.hitler.id) {
                                        gamestate.hostChannel.send(gameEndEmbed(gamestate, "L"));
                                        return;
                                    }

                                    let playerIndex = gamestate.players.findIndex(p => p.id == chosenUser.id);
                                    gamestate.players.splice(playerIndex, 1);
                                    let playerOrderIndex = gamestate.playerOrder.findIndex(p => p.id == chosenUser.id);
                                    gamestate.playerOrder.splice(playerOrderIndex, 1);

                                    setTimeout(function () {
                                        m.delete();
                                        if (chosenUser.id == chancellorAppointed.id) {
                                            resetRound(gamestate, chancellorAppointed);
                                        } else {
                                            resetRound(gamestate, { id: undefined });
                                        }
                                    }, 3000)
                                })
                            })
                        return;
                    default:
                        break;
                }
            }

            resetRound(gamestate, chancellorAppointed);
        });
    } catch (error) {
        console.error("Error in chancellor card selection:", error);
        throw error;
    }
};

const resetRound = (gamestate, chancellorAppointed, pickedPresident) => {
    gamestate.lastPresident = gamestate.president;
    gamestate.lastChancellor = chancellorAppointed;
    gamestate.board.resetCounters = 0;

    if (pickedPresident) {
        gamestate.president = pickedPresident;
    } else {
        gamestate.presidentIndex = (gamestate.presidentIndex + 1) % gamestate.playerOrder.length;
        gamestate.president = gamestate.playerOrder[gamestate.presidentIndex];
    }
    // gamestate.rotatePresidentToFront();
    gamestate.chancellorCandidate = undefined;
    setTimeout(function () {
        gamestate.boardState.edit({ embeds: [gameBoardEmbed(gamestate)] });
        setTimeout(function () {
            return voteForChancellor(gamestate);
        }, 3000)
    }, 3000)
}
