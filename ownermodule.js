// ownermodule.js
// author: ras0219

var util = require('util');
var BaseModule = require('./basemodule');
var Game = require('./game');

function OwnerModule(client) {
    // This wrapper
    var self = this;
    // Call superconstructor
    OwnerModule.super_.call(this, client);

    // Require owner
    if (this.config.owner === undefined)
        throw new Error("OwnerModule requires an owner");

    // On identify, connect to wolfgame
    this.once('identified', function () {
        this.say(this.config.owner, 'Initialized.');
    });

    // Listen to owner
    this.on('pm#' + this.config.owner, function (text) {
        if (text.substring(0,5) == 'eval ') {
            try {
                var e = eval(text.substring(5));
                this.say(this.config.owner, e.toString());
            } catch (error) {
                this.say(this.config.owner, "Caught error: " + error);
            }
        } else if (text == 'quit') {
            this.say(this.config.owner, 'quitting');
            this.disconnect();
            process.exit(0);
        }
    });
}

util.inherits(WolfModule, BaseModule);

module.exports = WolfModule;