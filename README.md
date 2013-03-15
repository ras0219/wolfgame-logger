Wolfgame Logger
===============

This application is an IRC bot that monitors #wolfgame on freenode and
collects domain specific information (Not generic stuff like nick
activity and common words).

Installation
------------
The usual.

    # Install Dependencies
    npm install
    # Run program
    node core.js


Application Structure
---------------------
The general idea is that core.js loads a HotReloadClient (which
derives from Client which derives from irc.Client).  It then spawns a
node REPL on standard in and drops into the event loop.

The actual modules which process information are loaded into the
HotReloadClient (e.g. `client.loadModule('./wolfmodule');`).  The code
can be updated while the bot is connected and reloaded using
HotReloadClient.reloadModule(modulename).

Database Backend
----------------
The application is currently configured to use a MongoDB backend, with
document schemas as follows:

    {
        _id : <id>,
        players : [ 'player1', 'player2', ... ],
        roles : { 'player1' : 'wolf', 'player2' : 'drunk', ... },
        log : [
            { from : 'player1',
              message : 'I think player2 is wolf',
              time : <ISODate object>
            },
            ...
        ]
    }