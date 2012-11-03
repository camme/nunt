var nunt = require('../../lib/nunt');
var express = require('express');
var app = express.createServer();

// this has to be initiated first, before we can use the middleware
nunt.init({ server: app });

app.configure(function(){
    app.use(nunt.middleware());
    app.use(express.static(__dirname + '/public'));
});

// everytime a client connects, we send a greeting
nunt.on(nunt.CONNECTED, function(e) {
    nunt.send("event.from.server", {message: "Hello Browser! I just sent this from the server!"});
});


app.listen(1337);
