// wolfclient.js
// author: ras0219

var util = require('./util');
var Client = require('./client');
var Game = require('./game');

function WolfClient(config) {
    // Call superconstructor
    WolfClient.super_.call(this, config);

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
util.inherits(WolfClient, Client);
module.exports = WolfClient;