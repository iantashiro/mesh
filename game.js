let gamestages = require('./data/gamestages');

module.exports = class Game {
    constructor(client, author, hostChannel, players, debugMode, boardState) {
        /**
         * Meta 
         */
        this.client = client;
        this.author = author;
        this.hostUser = author.user ?? author;
        this.hostChannel = hostChannel;
        this.players = players;
        this.boardState = boardState;
        this.debugMode = debugMode;

        // Assign player roles and other meta information
        this.playerInfo = this.givePlayersRoles(players);
        this.playerOrder = this.playerInfo.playerOrder;
        this.dead = [];
        this.hitler = this.playerInfo.hitler;
        this.hitlerKnows = false;
        this.cardCount = {
            liberal: 8,
            fascist: 11
        };

        this.deck = this.shuffleDeck(8, 11);
        this.discard = { liberal: 0, fascist: 0 };

        this.factionCount = {
            liberal: [3, 4, 4, 5, 5, 6][players.length - 5],
            fascist: [2, 2, 3, 3, 4, 4][players.length - 5],
        };

        this.board = {
            liberalOnBoard: 0, // 5 liberal slots
            fascistOnBoard: 0, // 6 fascist slots  // initial policies on game start
            resetCounters: 0,
            fascistRuleset: this.pickFascistRuleset(players)
        };

        /**
         * VOTING: VOTING for president / chancellor
         */
        this.gameStage = gamestages.PCHOOSE;
        this.presidentIndex = Math.floor(Math.random() * players.length);
        this.president = players[this.presidentIndex];
        this.chancellor = null;
        this.chancellorCandidate = undefined;

        // elected president and chancellor
        this.lastPresident = { id: undefined };
        this.lastChancellor = { id: undefined };

        this.getLiberalPlayers = _ => this.playerInfo.liberals;
        this.getFascistPlayers = _ => this.playerInfo.fascists;

        for (let p of this.playerInfo.liberals) {
            p.role = "L";
        }

        for (let p of this.playerInfo.fascists) {
            p.role = "F";
        }
    }

    pickFascistRuleset = players => {
        switch (players.length) {
            case 5:
            case 6:
                this.hitlerKnows = true;
                return [' + ', ' + ', 'PE', 'PK', 'PK', ' + '];
            case 7:
            case 8:
                return [' + ', 'PI', 'PP', 'PK', 'PK', ' + '];
            case 9:
            case 10:
                return ['PI', 'PI', 'PP', 'PK', 'PK', ' + '];
            default:
                return [];
        }
    };

    givePlayersRoles = players => {
        let playersCpy = players.slice(0);
        let playerOrder = playersCpy.slice(0);
        shuffleArray(playerOrder);

        let fascists = [];
        let liberals = [];
        let fascCount = [2, 2, 3, 3, 4, 4][players.length - 5];

        // Assign fascists randomly
        while (fascists.length < fascCount) {
            let rand = Math.floor(Math.random() * playersCpy.length);
            fascists.push(playersCpy[rand]);
            playersCpy.splice(rand, 1);
        }

        liberals = playersCpy.map(p => p);

        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }

        let hitler = fascists[Math.floor(Math.random() * fascists.length)];
        console.log(`Hitler assigned to: ${hitler.realUser.username}`);


        return {
            liberals,
            fascists,
            playerOrder,
            hitler
        };
    };

    shuffleDeck = (lib, fasc) => {
        let deck = [...Array(lib + fasc)].map((x, i) => {
            if (i < lib) {
                return "L";
            } else {
                return "F";
            }
        });

        for (var i = deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = deck[i];
            deck[i] = deck[j];
            deck[j] = temp;
        }

        return deck;
    };

    rotatePresidentToFront = () => {
        while (this.playerOrder[0].id != this.president.id) {
            let first = this.playerOrder.shift();
            this.playerOrder.push(first);
        }
    };
};
