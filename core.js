// core.js
// author: ras0219

// Objective: Parse out individual wolfgames and record all sayings
// and actions in a manipulable format

var repl = require('repl');
var settings = require('./configuration');
var HRClient = require('./hotreloadclient');

var client = new HRClient(settings);

client.on('error', function(message) {
    console.log('\n**********');
    console.log('Error: ');
    console.log(message);
    console.log('**********');
});

// Load modules
client.loadModule('./modules/wolfmodule');
client.loadModule('./modules/ownermodule');

// Long term Repl
var shellrepl = repl.start({
    prompt: 'irc-bot> ',
    terminal: true,
    useGlobal: true
});

shellrepl.context.client = client;
