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
		port: 8881/*,
		socketioLogLevel: 0 */
	}
};

// the event framework
var nunt = require('nunt');

function initServer(serverConfig)
{

	// start the server
	var express = require('express');
	var app = express.createServer();

	app.configure(function(){
		app.use(
			require('stylus').middleware(
				{
					force: false,
					compress: true,
					src: __dirname + "/../public",
				    dest: __dirname + "/../public"
				}
			)
		);
		app.use(express.static(__dirname + '/../public'));
	});

	// connect the socket server
	app.listen(config.server.port);

	return app;
}


function initNunt(server)
{
	
	// log the start
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

	// expose the events

	// when the event system has started, we create the client API (optional of course)
	var scopeList = [nunt.events];

	// build the api from all wanted events
	var apiBuildEvent = new nunt.events.server.api.BUILD_API_REQUEST(scopeList, __dirname + "/../public/js/mvc/events/server.events.js");
	nunt.send(apiBuildEvent);


}



// begin!
var app = initServer(config);
initNunt(app);
	


	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	



