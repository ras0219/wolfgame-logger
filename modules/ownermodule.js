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

    var unlocked = false;

    // Require owner
    if (this.config.owner === undefined)
        throw new Error("OwnerModule requires an owner");

    // On identify, connect to wolfgame
    this.once('identified', function () {
        this.say(this.config.owner, 'Initialized.');
    });

    this.on('message#', this.withSafety(function (from, to, text) {
        if (from == this.config.owner) {
            if (text.substring(0,6) == '.eval ' && unlocked) {
                try {
                    var e = eval(text.substring(6));
                    if (e === undefined)
                        this.say(to, 'undefined');
                    else
                        this.say(to, e.toString());
                } catch (error) {
                    this.say(to, "Caught error: " + error);
                }
            }
        }
    }));

    // Listen to owner
    this.on('pm#' + this.config.owner,
            this.withSafety(function (text) {
                if (text.substring(0,5) == 'eval ' && unlocked) {
                    try {
                        var e = eval(text.substring(5));
                        if (e === undefined)
                            this.say(this.config.owner, 'undefined');
                        else
                            this.say(this.config.owner, e.toString());
                    } catch (error) {
                        this.say(this.config.owner, "Caught error: " + error);
                    }
                } else if (text == 'quit') {
                    this.say(this.config.owner, 'quitting');
                    this.client.disconnect();
                    process.exit(0);
                }
            }));
}

util.inherits(OwnerModule, BaseModule);

module.exports = OwnerModule;