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
}

Game.prototype.recvmsg = function (from, message) {
    this.log[this.log.length] = { from: from, message: message };

    if (from == 'pywolf')
        this.onGameMsg(message);
};

Game.prototype.onGameMsg = function (msg) {
    var i = msg.search(': Welcome to Werewolf');
    if (i > -1) { this.onWelcomeMsg(msg.substring(0,i)); }

    i = msg.search('The seer was ');
    if (i > -1) { this.onEndingMsg(msg); }
};

Game.prototype.onWelcomeMsg = function (msg) {
    var players = msg.split(", ");
    this.players = players;
    return;
};

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

Game.prototype.processRoleMsg = function (msg) {
    // Remove special formatting
    msg = msg.replace('\u0002','');

    prefixes = {
        'The wolves were ': function (suffix) {
            var wolves;
            wolves = suffix.split(' and ');
            wolves = _.flatten(_.map(wolves, function (w) {
                return w.split(', ');
            }));

            for (var k in wolves) {
                this.roles[k] = "wolf";
            }
        }
    };
    function autoprefix(p, n2) {
        n2 = n2 || p;
        prefixes['The '+p+' was '] = function (s) {
            this.roles[s] = n2;
        };
    }
    autoprefix('wolf');
    autoprefix('seer');
    autoprefix('village drunk', 'drunk');
    autoprefix('seer');
    autoprefix('harlot');
    autoprefix('traitor');

    for (var k in prefixes) {
        if (msg.substring(0, k.length) == k)
            return prefixes[k].call(this, msg.substring(k.length));
    }
};


module.exports = Game;