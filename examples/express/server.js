var nunt = require('../../lib/nunt');
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);

// this has to be initiated first, before we can use the middleware
nunt.init({ server: server });

app.configure(function(){
    app.use(nunt.middleware());
    app.use(express.static(__dirname + '/public'));
});

// everytime a client connects, we send a greeting
nunt.on(nunt.CONNECTED, function(e) {
    nunt.send("event.from.server", {message: "Hello Browser! I just sent this from the server!"});
});

server.listen(1337);
