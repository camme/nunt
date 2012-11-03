## nunt

Superlightweight event system for javascript. Easy to use just in the client, easy to use on the server and seamless communication between both. If you like to create event based apps, this is for out.

Look at the example to see how easy it works or read more here [http://onezerozeroone.com:8778/](http://onezerozeroone.com:8778/)

## Install under nodejs

npm install nunt

## To use it on the client

Just load nunt and its ready to be used. 

    <script type="text/javascript" charset="utf-8" src="js/nunt.js"></script>
    <script type="text/javascript" charset="utf-8">

        (function(nunt){

            // listen to events
            nunt.on(nunt.READY, ready);
            nunt.on("foo.bar", update);

            function ready(e) {
                nunt.send("foo.bar", {message: "Hello fro the browser"});
            }

            function update(event) {
                // when we get the message, we just display it
                console.log(event.message);
            }

        })(nunt);

    </script>

## To use it with node and client

On the browser, you include nunt hosted by your app automatically:

    <script type="text/javascript" charset="utf-8" src="/socket.io/socket.io.js"></script>
    <script type="text/javascript" charset="utf-8" src="/nunt/nunt.js"></script>
    <script type="text/javascript" charset="utf-8">

        (function(nunt){

            // listen to events
            nunt.on("event.from.server", update);

            function update(event) {
                // when we get the message from the server, we just display it
                console.log(event.message);
            }

        })(nunt);

    </script>

	
On your server, you just initiate it like this:

	var nunt = require('nunt');

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

Or you could use express and use nunt trough middleware:

	var nunt = require('nunt');
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

## License 

(The MIT License)

Copyright (c) 2011 Camilo Tapia &lt;camilo.tapia@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.