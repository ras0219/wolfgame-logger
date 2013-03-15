// hotreloadclient.js
// author: ras0219

// Recaching adapted from stack overflow:
// http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate

/**
 *  Removes a module from the cache
 **/
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name

    var modlist = require.searchCache(moduleName);
    for (k in modlist) {
        delete require.cache[k];
    }
};

/**
 *  Runs over the cache to search for all the cached
 *  files
 **/
require.searchCache = function (moduleName) {
    var mod = require.resolve(moduleName);
    var modlist = {};

    // Check for mod in cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recurse on results
        (function run(mod) {
            if (mod.id in modlist)
                return;
            modlist[mod.id] = mod;
            mod.children.forEach(function (c) { run(c); });
        })(mod);
    }

    return modlist;
};

var Client = require('./client');
var util = require('util');

function HotReloadClient(config) {
    HotReloadClient.super_.call(this, config);
    this.modules = {};

    // Monkey patch in a new emit system
    var oldemit = this.emit;
    this.emit = function (ev) {
        if (ev != 'error')
            for (k in this.modules)
                this.modules[k].emit.apply(this.modules[k],
                                           arguments);
        oldemit.apply(this, arguments);
    };
}
util.inherits(HotReloadClient, Client);

HotReloadClient.prototype.loadModule = function (name) {
    try {
        var Module = require(name);
        this.unloadModule(name);
        this.modules[name] = new Module(this);
    } catch (error) {
        console.error("Error while loading Module " + name);
        console.error(error);
    }
};

HotReloadClient.prototype.reloadModule = function (name) {
    var modlist = require.uncache(name);
    try {
        var Module = require(name);
        this.unloadModule(name);
        this.modules[name] = new Module(this);
    } catch (error) {
        // Restore cache
        for (k in modlist) {
            require.cache[k] = modlist[k];
        }
        // Rethrow error for great justice
        throw error;
    }
};

HotReloadClient.prototype.unloadModule = function (name) {
    if (this.modules[name] !== undefined
        && this.modules[name].onUnload !== undefined)
        this.modules[name].onUnload();
    this.modules[name] = undefined;
};

module.exports = HotReloadClient;
