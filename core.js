// core.js
// author: ras0219

// Objective: Parse out individual wolfgames and record all sayings
// and actions in a manipulable format

// FOR FUTURE USE
// delete require.cache['/home/shimin/test2.js']

var repl = require('repl');
var settings = require('./configuration');
var HRClient = require('./hotreloadclient');

var client = new HRClient(settings);
client.on('error', function(message) {
    console.log('error: ', message);
});

// Load modules
client.loadModule('./wolfmodule');

// Long term Repl
var shellrepl = repl.start({
    prompt: 'irc-bot> ',
    terminal: true,
    useGlobal: true
});

shellrepl.context.client = client;
