// game.js
// author: ras0219

var _ = require('underscore');

//////////////////////////////////////////////////////////////////////
// Game
//////////////////////////////////////////////////////////////////////
function Game() {
    this.log = [];
    this.players = [];
    this.roles = {};
    this.version = 1;
}

// Copy constructor (kindof)
Game.prototype.copy = function (game) {
    // Objective here is to rebuild a latest-version game object from
    // arbitrarily old data.

    this.copylog(game.log);
};
// Copy constructor (kindof)
Game.prototype.copylog = function (gamelog) {
    // Objective here is to rebuild a latest-version game object from
    // arbitrarily old data.

    for (var i in gamelog) {
        this.recvmsg(gamelog[i].from,
                     gamelog[i].message,
                     gamelog[i].time);
    }
};

// Executed when a message is received during a game.
Game.prototype.recvmsg = function (from, message, time) {
    time = time !== undefined ? time : new Date();

    this.log[this.log.length] = {
        from: from,
        message: message,
        time: time
    };

    if (from == 'pywolf')
        this.onGameMsg(message);
};

// Executed when a message is received from pywolf
Game.prototype.onGameMsg = function (msg) {
    var i = msg.search(': Welcome to Werewolf');
    if (i > -1) { this.onWelcomeMsg(msg.substring(0,i)); }

    i = msg.search('The seer was ');
    if (i > -1) { this.onEndingMsg(msg); }

    var winmsg = 'Game over! All the wolves are dead!';
    if (msg.substring(0, winmsg.length) == winmsg) {
        this.win = 'village';
    }

    var wolfmsg1 = 'Game over! There are the same number';
    if (msg.substring(0, wolfmsg1.length) == wolfmsg1) {
        this.win = 'wolves';
    }
};

// Executed when the start game message is received.
//
// msg - list of players participating as a string
Game.prototype.onWelcomeMsg = function (msg) {
    var players = msg.split(", ");
    this.players = players;
    return;
};

// Executed when the end game message is received.  This message
// describes every player's role.
//
// msg - list of role assignments as a string
Game.prototype.onEndingMsg = function (msg) {
    // Split open messages
    var rolemsgs = msg.split(". ");

    // Remove period from last message
    var lastmsg = rolemsgs[rolemsgs.length-1];
    rolemsgs[rolemsgs.length-1] = lastmsg.substring(0, lastmsg.length-1);

    // Process messages
    for (var k in rolemsgs) {
        this.processRoleMsg(rolemsgs[k]);
    }
    return;
};

// Executed to process each role statement.
//
// msg - sentence containing a role assignment (period is stripped)
Game.prototype.processRoleMsg = function (msg) {
    // Remove special formatting
    msg = msg.replace(/\u0002/g,'');

    prefixes = {
        'The wolves were ': function (suffix) {
            var wolves;
            wolves = suffix.split(' and ');
            wolves = _.flatten(_.map(wolves, function (w) {
                return w.split(', ');
            }));

            this.roles['wolf'] = wolves;
        }
    };
    function autoprefix(p, n2) {
        n2 = n2 || p;
        prefixes['The '+p+' was '] = function (s) {
            this.roles[n2] = [s];
        };
    }
    autoprefix('wolf');
    autoprefix('seer');
    autoprefix('village drunk');
    autoprefix('gunner');
    autoprefix('detective');
    autoprefix('cursed villager');
    autoprefix('guardian angel');
    autoprefix('seer');
    autoprefix('harlot');
    autoprefix('traitor');

    for (var k in prefixes) {
        if (msg.substring(0, k.length) == k) {
            prefixes[k].call(this, msg.substring(k.length));
            return;
        }
    }
    // Was unable to process the given message

};

module.exports = Game;
