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

// start the server
var express = require('express');
var app = express.createServer();

app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});

// connect the socket server
app.listen(config.server.port);

nunt.init({
    server: app,
    load: [__dirname + "/mvc"]
});

