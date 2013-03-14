// game.js
// author: ras0219

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

    this.log[this.log.length] = { from: from, message: message };

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


module.exports = Game;