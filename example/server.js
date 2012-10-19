/************************************
 * Example of nodejs, nunt, socketio working toghether. This is just the initializer.
 * Create by camilo tapia 
 ************************************/

/* config */
var config = {
    version: 0.2,
    server:
    {
        url: "http://localhost:8881",
        port: 8881
    }
};

// the event framework
var nunt = require('../src/nunt/lib/nunt');

function initServer(serverConfig)
{

    // start the server
    var express = require('express');
    var app = express.createServer();

    app.configure(function(){
        app.use(express.static(__dirname + '/public'));
    });

    // connect the socket server
    app.listen(config.server.port);

    return app;
}


function initNunt(server)
{
    
    // log the start
    console.log();
    nunt.log("Starting eventeco server version " + config.version + "...");
    
    // read external modules in a batch
    nunt.loadPaths([__dirname + "/mvc"]); 

    //init the event system. in the browser this is done automatically, in node we trigger it manually
    nunt.init(
        {
            server: {
                server: server,
                options: config.server
            }
        }
    );

}

// begin!
var app = initServer(config);
initNunt(app);