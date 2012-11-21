# nunt

Superlightweight event system for javascript. Easy to use just in the client, easy to use on the server and seamless communication between both. If you like to create event based apps, this is for out.

Look at the example to see how easy it works, or read more here [http://nunt.onezerozeroone.com/](http://nunt.onezerozeroone.com/)

## Installing it

In node

	npm install nunt

In the browser

	<script type="text/javascript" charset="utf-8" src="js/nunt.js"></script>

## Basics

You basically use it like this:

	// listen
	nunt.on("foo", function(event){
    	console.log("hello " + event.name);
	});

	// send
	nunt.send("foo", {name: "bar"});

For more information, go to the documentation site or read the following examples. There are even more examples in the repo.

## Using it on the browser

If you want to use it in the browser, just add the nunt.js file to your scripts and begin to use it:

    <script type="text/javascript" charset="utf-8" src="js/nunt.js"></script>
    <script type="text/javascript" charset="utf-8">

        (function(nunt){

            // listen to events
            nunt.on(nunt.READY, ready);
            nunt.on("foo.bar", update);

            function ready(e) {
                nunt.send("foo.bar", {message: "Hello from the browser"});
            }

            function update(event) {
                // when we get the message, we just display it
                console.log(event.message);
            }

        })(nunt);

    </script>

## Using it with node and the browser

The power of nunt is strongest when used with node. It allows your app to communicate with the same type of events no matter if the events originate from the server or the client. To use it for client/server communication, socket.io is required. Just run 

	npm install socket.io 

Here is a short example to run with node (more in the example folders):

	var nunt = require('nunt');

	// this part is only required if you want to host a web app, otherwise there is no need for an http server
	var http = require('http');
	var fs = require('fs');
	
	// the web server
	var server = http.createServer(function (req, res) {
    	fs.readFile('index.html', function(err, fileContent) { 
        	res.writeHead(200, {'Content-Type': 'text/html'});
	        res.end(fileContent);
    	});
	}).listen(1337);

	// start nunt
	nunt.init({ server: server });

	// everytime a client connects, we send a greeting
	nunt.on(nunt.CONNECTED, function(e) {
    	nunt.send("event.from.server", {message: "Hello Browser!"});
	});

On the browser, you include nunt hosted by your app automatically (adding socket.io as well):

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

## With express
Nunt can also be used with express, making the server code a little smaller:

	var nunt = require('nunt');
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

## Compability
Since nunt 1.3.0, the client script for using with node is integrated to the base nunt script. This means that the only needed include is nunt.js on the client.

## The future:
The base of nunt won't change, but I like to test to convert the events in node to real node events, as opposed to todays custom event emitter. 

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