// wolfmodule.js
// author: ras0219

var util = require('util');
var BaseModule = require('./basemodule');
var Game = require('./game');

var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;

function WolfModule(client) {
    var self = this;
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
    this.on('gameover', this.withSafety(function (game) {
        if (this.client.config.owner)
            this.client.say(this.client.config.owner,
                            'Game finished. Logged '
                            + game.log.length
                            + ' messages.');
        console.log('players', game.players);
        console.log('roles', game.roles);

        if (this.client.dbwolfgame !== undefined) {
            // Insert without write ack
            this.client.dbwolfgame.insert(game, {w:1});
        }
    }));

    this.on('initialized', function () {
        this.client.join('#wolfgame');
    });

    if (this.client.db == undefined)
        MongoClient.connect(
            'mongodb://localhost:27017/wolfgame',
            this.withSafety(function (err, db) {
                if (err || !db)
                    // Handle errors
                    console.log('Error occurred while loading database!');
                if (self.client.db !== undefined) {
                    self.client.db.close();
                }
                self.client.db = db;
                self.client.dbwolfgame = db.collection('games');
            }));
}

util.inherits(WolfModule, BaseModule);

module.exports = WolfModule;
