// Objective: Parse out individual wolfgames and record all sayings
// and actions in a manipulable format
var irc = require('irc');
var settings = require('configuration');

var client = new irc.Client('irc.freenode.net', settings.nickname, {
    channels: [],
});

var game = {
    status: false,
    log: [],

    start: function () { this.status = true; this.log = []; },
    print: function() { return 'log\n' + this.log.join('\n'); },
}

client.on('message#wolfgame', function (from, message) {
    if (from == 'pywolf') {
        if (message.search('Welcome to Werewolf')) {
            game.start();
        }
    }
    if (game.status) {
        log[log.length] = { from : from, message : message };
    }
    if (from == 'pywolf') {
        if (message.search('The seer was ')) {
            game.status = false;
            client.emit('gameover', game);
        }
    }
});

client.on('gameover', function (game) {
    console.log(game.log);
    client.say(settings.owner, 'Game finished. Logged ' + game.log.length + ' messages.');
});

client.addListener('pm', function (from, message) {
    if (from == settings.owner) {
        if (message.substring(0,4) == 'eval') {
            eval(message.substring(5));
        } else if (message == 'quit') {
	    client.say(from, 'quitting.');
            client.disconnect();
	    process.exit(0);
        } else if (message == 'join wolfgame') {
            client.join('#wolfgame');
        } else if (message == 'part wolfgame') {
            client.part('#wolfgame');
        }
    }
});

/** Framework Extension **/
client.on('notice', function (from, to, text, message) {
    if (from != undefined)
        client.emit('notice#' + from, from, to, text, message);
});

client.once('notice#NickServ', function () {
    client.say('NickServ', 'identify ' + settings.password);
    client.once('notice#NickServ', function (from, to, text, message) {
        if (text.substring(0,22) == 'You are now identified')
            client.emit('identified');
        else
            client.emit('error', 'Could not identify self with server.');
    });
});


/** General Purpose Debugging **/
client.on('raw', function (msg) {
    console.log(msg.prefix + ' => ' + msg.command + ':', msg.args); 
});
client.on('error', function(message) {
    console.log('error: ', message);
});
/*
client.on('notice', function(from, to, text, message) {
    console.log('(Notice) ' + from + ' => ' + to + ': ' + text);
});
client.on('registered', function (message) {
    console.log('(Registered) ' + message);
});
client.on('pm', function(from, message) {
    console.log('(PM) ' + from + ': ' + message);
});
client.on('join', function(channel, nick, message) {
    console.log('(Join) ' + nick + ' joined ' + channel
                + ' with ' + message);
});
client.on('part', function(channel, nick, reason, message) {
    console.log('(Part) ' + nick + ' parted ' + channel
                + ' reason ' + reason + ' with ' + message);
});
client.on('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
});*/
