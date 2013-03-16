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
var error_no_results = 'Sorry, no results were found for that query.';
var error_not_json = 'Sorry, I can only understand JSON queries.';

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

    this.on('pm', this.withSafety(function (from, message) {
        if (message.substring(0,1) == '~') {
            this.cmd(from, from, message.substring(1));
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

    // Load the database
    this.loadDatabase();

    this.floodProtection = 0;
}

util.inherits(WolfModule, BaseModule);

WolfModule.prototype.loadDatabase = function () {
    if (this.client.db !== undefined)
        return;

    var self = this;
    MongoClient.connect('mongodb://localhost:27017/wolfgame', this.withSafety(
        function (err, db)
        {
            if (err || !db)
                // Handle errors
                console.log('Error occurred while loading database!');
            if (self.client.db !== undefined) {
                self.client.db.close();
            }
            self.client.db = db;
            self.client.dbwolfgame = db.collection('games');
        }
    ));
};

WolfModule.prototype.cmd = function (from, reply, cmdmsg) {
    if (new Date() - this.floodProtection < 10000) {
        // Trigger flood protection
        this.client.notice(from, 'Sorry, I\'m in flood prevention mode. Try again in '
                           + (10000 - (new Date() - this.floodProtection))
                           + ' milliseconds.');
        return;
    }
    var cmds = cmdmsg.split(' ');

    if (cmds.length == 1 && cmds[0] == 'lastgame') {
        this.cmdLastgame(from, reply);
    } else if (cmds[0] == 'mapreduce') {
        this.cmdMapreduce(from, reply, cmdmsg.substring(10));
    } else {
        this.client.say(reply, from + ': Sorry, that\'s not a command I understand.');
        return;
    }
    this.floodProtection = new Date();
};

WolfModule.prototype.cmdMapreduce = function (from, reply, command) {
    if (this.client.dbwolfgame === undefined) {
        this.client.say(reply, error_db_inaccessible + ' [0001]');
        return;
    }
    var query, self = this;
    try {
        query = JSON.parse(command);
    } catch (error) {
        this.client.say(reply, error_not_json + ' [0002]');
        return;
    }

    var map = function () {
        emit(this.win, 1);
        emit('games', 1);
    };
    var reduce = function (k, v) {
        count = 0;
        for(i=0;i<v.length;++i) {
            count += v[i];
        }
        return count;
    };

    opts = { out: {inline:1},
             query: query};
    this.client.dbwolfgame.mapReduce(map, reduce, opts, this.withSafety(
        function (err, res) {
            if (err) {
                self.client.say(reply, err + ' [0003]');
                return;
            } else if (!res || res.length == 0) {
                self.client.say(reply, error_no_results + ' [0004]');
                return;
            }
            var results = {games:0, wolves:0, village:0};
            for (var i in res) {
                results[res[i]._id] = res[i].value;
            }
            var msg = 'There are no games matching that criteria.';
            if (results.games > 0) {
                msg = [ 'There ',
                        results.games == 1 ? 'is ' : 'are ',
                        results.games,
                        results.games == 1 ? ' game' : ' games',
                        ' matching that criteria.',
                        ' The village won ',
                        results.village / results.games * 100,
                        '% of them.'
                      ].join('');
            }
            self.client.say(reply, from + ': ' + msg);
        }
    ));
};

WolfModule.prototype.cmdLastgame = function (from, reply) {
    if (this.client.dbwolfgame === undefined) {
        this.client.say(reply, from + ': ' + error_db_inaccessible + ' [0001]');
        return;
    }
    var self = this;
    this.client.dbwolfgame.findOne({}, {sort:{_id:-1}}, this.withSafety(
        function (err, item) {
            if (err) {
                self.client.say(reply,
                                from + ': ' + error_db_inaccessible + ' [0002]');
                return;
            } else if (!item) {
                self.client.say(reply, from + ': ' + error_no_results + ' [0003]');
                return;
            }
            var msg = [ 'The last game was ',
                        emph(item.players.length),
                        ' players.',

                        ' It started at ',
                        emph(item.log[0].time.toLocaleTimeString()),
                        ' and ended at ',
                        emph(item.log[item.log.length-1].time.toLocaleTimeString()),
                        '.'
                      ].join('');
            self.client.say(reply, from + ': ' + msg);
        }));
};

WolfModule.prototype.schemaUpdate = function () {
    if (this.client.dbwolfgame === undefined) {
        console.log('could not access database');
        return;
    }

    this.client.dbwolfgame.find({}, {log:1}).toArray(
        function (err, items) {
            for(var i in items) {
                var g = new Game();
                // Rebuild game from log
                g.copy(items[i]);
                // Replace with rebuilt game
                this.client.dbwolfgame.update({_id: items[i]._id},
                                              g, {w: 0});
            }
        }
    );
};

module.exports = WolfModule;
