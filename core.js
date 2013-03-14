// Objective: Parse out individual wolfgames and record all sayings
// and actions in a manipulable format

// FOR FUTURE USE
// delete require.cache['/home/shimin/test2.js']

var irc = require('irc');
var util = require('util');
var _ = require('underscore');

//////////////////////////////////////////////////////////////////////
// Game
//////////////////////////////////////////////////////////////////////
function Game() {
    this.status = false;
    this.log = [];
    this.players = [];
    this.roles = {};
}

Game.prototype.recvmsg = function (from, message) {
    if (!this.status)
        return;

    this.log[this.log.length] = { from: from, message: message }

    if (from == 'pywolf')
        this.gamemsg(message);
};

Game.prototype.gamemsg = function (message) {
    var i = message.search(': Welcome to Werewolf');
    if (i > -1) {
        var players = message.substring(0,i).split(", ");
        this.players = players;
        return;
    }
    
    i = message.search('The seer was ');
    if (i > -1) {
        var rolemsgs = message.split(". ");
        return;
    }
};

//////////////////////////////////////////////////////////////////////
// Client
//////////////////////////////////////////////////////////////////////
function Client(config) {
    // Require configuration
    config.nickname || error("nickname required");
    config.password || error("password required");

    // Fill in defaults for configuration
    this.config = _.defaults(config, {
        userName: config.nickname,
        realName: config.nickname
    });

    // Call superconstructor
    Client.super_.call(this, 'irc.freenode.net',
                       config.nickname, config);

    /////////////////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////////////////
    // Forward notices to notice#<username>
    this.on('notice', function (from, to, text, msg) {
        if (from !== undefined)
            this.emit('notice#' + from, to, text, msg);
    });

    // Automatic NickServ login
    this.once('notice#NickServ', function () {
        this.say('NickServ', 'identify ' + this.config.password);
        this.once('notice#NickServ', function (to, text, message) {
            if (text.substring(0,22) == 'You are now identified')
                this.emit('identified');
            else
                this.emit('error', 'Could not identify self with server.');
        });
    });

    //// Wolfgame specific events

    // Listen to master pywolf
    this.on('message#wolfgame', function (from, message) {
        if (from == 'pywolf') {
            if (message.search('Welcome to Werewolf') > -1) {
                this.game = new Game();
            }
        }
        if (this.game !== undefined) {
            this.game.recvmsg(from, message);
        }
        if (from == 'pywolf') {
            if (message.search('The seer was ') > -1) {
                client.emit('gameover', this.game);
                this.game = undefined;
            }
        }
    });

    // On identify, connect to wolfgame
    this.once('identified', function () {
        if (this.config.owner)
            this.say(this.config.owner, 'Initialized.');
        this.join('#wolfgame');
    });

    // On gameover, log the game
    this.on('gameover', function (game) {
        console.log(game.log);
        this.say(settings.owner, 'Game finished. Logged '
                 + game.log.length + ' messages.');
    });

    this.addListener('pm', function (from, message) {
        if (from == settings.owner) {
            if (message.substring(0,4) == 'eval') {
                eval(message.substring(5));
            } else if (message == 'quit') {
	        this.say(from, 'quitting.');
                this.disconnect();
	        process.exit(0);
            }
        }
    });
}

// Add inheritance
util.inherits(Client, irc.Client);

module.exports = {
    Game: Game,
    Client: Client
};
