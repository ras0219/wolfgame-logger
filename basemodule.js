// basemodule.js
// author: ras0219

var util = require('util');
var EventEmitter = require('events').EventEmitter;

function BaseModule(client) {
    // Call superconstructor
    BaseModule.super_.call(this);

    this.client = client;
    this.config = client.config;
}
util.inherits(BaseModule, EventEmitter);

BaseModule.prototype.say = function () {
    this.client.say.apply(this.client, arguments);
};

module.exports = BaseModule;