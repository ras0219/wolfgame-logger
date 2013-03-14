// core.js
// author: ras0219

// Objective: Parse out individual wolfgames and record all sayings
// and actions in a manipulable format

// FOR FUTURE USE
// delete require.cache['/home/shimin/test2.js']

var repl = require('repl');
var core = require('./core');
var settings = require('./configuration');

var WolfClient = require('./wolfclient');
var client = new WolfClient(settings);

client.on('error', function(message) {
    console.log('error: ', message);
});

// Long term Repl
var shellrepl = repl.start({
    prompt: 'irc-bot> ',
    terminal: true,
    useGlobal: true
});

shellrepl.context.client = client;
