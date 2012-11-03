var nunt = require('../../lib/nunt');

// this part is only required if you want to host a web app, otherwise there is no need for an http server
var http = require('http');
var fs = require('fs');
var server = http.createServer(function (req, res) {
    fs.readFile('index.html', function(err, fileContent) { 
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(fileContent);
    });
}).listen(1337);

nunt.init({ server: server });

// everytime a client connects, we send a greeting
nunt.on(nunt.CONNECTED, function(e) {
    nunt.send("event.from.server", {message: "Hello Browser!"});
});
