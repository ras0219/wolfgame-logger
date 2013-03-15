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

BaseModule.prototype.withSafety = function (f) {
    return function () {
        try {
            f.apply(this, arguments);
        } catch (error) {
            this.emit('error', error);
        }
    };
};
BaseModule.prototype.say = function () {
    this.client.say.apply(this.client, arguments);
};
BaseModule.prototype.notice = function () {
    this.client.notice.apply(this.client, arguments);
};

module.exports = BaseModule;