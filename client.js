// client.js
// author: ras0219

var irc = require('irc');
var util = require('util');
var _ = require('underscore');

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
    this.on('pm', function (from, text, msg) {
        if (from !== undefined)
            this.emit('pm#' + from, text, msg);
    });

    // Automatic NickServ login
    this.login_status = false;
    this.once('notice#NickServ', function () {
        this.say('NickServ', 'identify ' + this.config.password);
        this.once('notice#NickServ', function (to, text, message) {
            if (text.substring(0,22) == 'You are now identified') {
                this.emit('identified');
                this.login_status = true;
            } else {
                this.emit('error', 'Could not identify self with server.');
            }
        });
    });

    // Listen for quit
    if (config.owner !== undefined)
        this.on('pm#' + config.owner, function (text, msg) {
            if (text == 'quit') {
                this.say(config.owner, 'quitting');
                this.disconnect();
                process.exit(0);
            }
        });
}

// Add inheritance
util.inherits(Client, irc.Client);

module.exports = Client;
