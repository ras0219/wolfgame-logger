// wolfmodule.js
// author: ras0219

var util = require('util');
var BaseModule = require('./basemodule');
var Game = require('./game');
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server;
var colorwrap = require('irc').colors.wrap;
var error_db_inaccessible = 'Sorry, database is currently inaccessible.';

//////////////////////////////////////////////////////////////////////
// Utility functions
//////////////////////////////////////////////////////////////////////
function escapename(name) {
    if (name == 'Mithadon')
        // Dumb clients
        return '_M_I_T_H_A_D_O_N_';
    return name.substring(0,1) + '\u0002\u0002' + name.substring(1);
}

function emph(msg) { return '\u0002' + msg + '\u0002'; }

//////////////////////////////////////////////////////////////////////
// WolfModule
//////////////////////////////////////////////////////////////////////
function WolfModule(client) {
    var self = this;
    // Call superconstructor
    WolfModule.super_.call(this, client);

    // Listen to master pywolf
    this.on('message#wolfgame', this.withSafety(function (from, message) {
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

        if (message.substring(0,1) == '~') {
            this.cmd(from, '#wolfgame', message.substring(1));
        }
    }));

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
            this.client.dbwolfgame.insert(game, function () {});
        }
    }));

    this.on('identified', function () {
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

var floodProtection = new Date();

WolfModule.prototype.cmd = function (from, reply, cmdmsg) {
    if (new Date() - floodProtection < 3000) {
        // Trigger flood protection
        return;
    }
    var cmds = cmdmsg.split(' ');
    if (cmds.length == 1 && cmds[0] == 'lastgame') {
        this.cmdLastgame(from, reply, cmds);
    } else if (cmds.length == 1 && cmds[0] == 'games') {
        this.cmdGames(from, reply, cmds);
    }
};

WolfModule.prototype.cmdGames = function (from, reply, cmds) {

};

WolfModule.prototype.cmdLastgame = function (from, reply) {
    var self = this;
    if (this.client.dbwolfgame === undefined) {
        this.client.say(reply, from + ': ' + error_db_inaccessible + ' [0001]');
        return;
    }
    this.client.dbwolfgame.findOne({}, {sort:{_id:-1}}, this.withSafety(
        function (err, item) {
            if (err || !item) {
                self.client.say(reply,
                                from + ': ' + error_db_inaccessible + ' [0002]');
                return;
            }
            var msg = [ 'The last game was '
                        + emph(item.players.length) + ' players ('
                        + _.map(item.players, escapename).join(', ') + ').'
                        ,

                        _.map(item.roles,
                              function (v,k) {
                                  return escapename(k) + ' was a ' + v + '.';
                              }).join(' ')
                        ,

                        'It started at '
                        + emph(item.log[0].time.toLocaleTimeString())
                        + ' and ended at '
                        + emph(item.log[item.log.length-1].time.toLocaleTimeString())
                        + '.'
                      ].join(' ');
            self.client.say(reply, from + ': ' + msg);
        }));
};

module.exports = WolfModule;
