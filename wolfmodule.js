// wolfmodule.js
// author: ras0219

var util = require('util');
var BaseModule = require('./basemodule');
var Game = require('./game');

function WolfModule(client) {
    // Call superconstructor
    WolfModule.super_.call(this, client);

    // Listen to master pywolf
    this.on('message#wolfgame', function (from, message) {
        if (from == 'pywolf') {
            if (message.search('Welcome to Werewolf') > -1) {
                this.game = new Game();
            }
        }
        if (this.game !== undefined) {
            this.game.recvmsg(from, message);

            if (from == 'pywolf') {
                if (message.search('The seer was ') > -1) {
                    this.client.emit('gameover', this.game);
                    this.game = undefined;
                }
            }
        }
    });

    // On gameover, log the game
    this.on('gameover', function (game) {
        if (this.client.config.owner)
            this.client.say(this.client.config.owner,
                     'Game finished. Logged '
                     + game.log.length
                     + ' messages.');
        console.log('players', game.players);
        console.log('roles', game.roles);
    });
}

util.inherits(WolfModule, BaseModule);

module.exports = WolfModule;
