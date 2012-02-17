var nunt = require('nunt');
var log = nunt.log;

function init(server, options)
{

	/* default config */
	
	var baseOptions = {
		autoConnect: true,
		url: 'localhost',
		port: 8112,
		handlers: [],
		socketioLogLevel: 0,
		silent: false,
		fakeSocket: false,
		cache: true
	};
	
	var options = nunt.extend(baseOptions, options);
	
	var cacheData = {};
	
	
	var log = global.log;

	var path = require('path');
	var LIB_DIR = path.dirname(__filename);

	// where to read the html files

	var url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	nodePath = require('path'),
	sys = require('sys'),
	querystring = require('querystring');
	

	server.get('/nunt/nunt.js', function(req, res){
			
		var file = require.resolve('nunt');
		var nuntJs = fs.readFileSync(file, 'utf8');
			
		// remove unwanted stuff
		nuntJs = nuntJs.replace(/-only for nodejs-[.\w\W]*?-end of only for nodejs-/gi, "");
		//nuntJs = nuntJs.replace(/\/\/.*?\n/g, "").replace(/[\t\n]/g, "").replace(/\*\//g, "*/\n\n");
			
		res.send(nuntJs);
	});

		
	server.get('/nunt/nunt.client.js', function(req, res){
	  
		var file = LIB_DIR  + "/nunt.client.js";
		var nuntClientJs = fs.readFileSync(file, 'utf8');
		
		var findConfigRe = /\/\* default url config \*\/((.|\t|\r|\n)*?);/gi;
		var clientCofig = "var base = {url: '" + options.url + "', autoConnect: " + options.autoConnect + "}; ";
		nuntClientJs = nuntClientJs.replace(findConfigRe, clientCofig);
		
			
		// remove unwanted stuff
		//nuntClientJs = nuntClientJs.replace(/\/\/.*?\n/g, "").replace(/[\t\n]/g, "").replace(/\*\//g, "*/\n\n");
		res.send(nuntClientJs);
	
	});

	var buffer = [],
	json = JSON.stringify,
	socketIOOPtions = {},
	io = io.listen(server),
	clientHashList = {};
	
	nunt.log.color("magenta", "Socket server started with port " + options.port + ". Happy socketing!");
	
	
	
	
	if (options.fakeSocket)
	{
		

		/* ************************************************** */
		/*      special just to make it work behind nginx     */
		/* ************************************************** */

		io.configure(function() {  
		  io.set("transports", ["xhr-polling"]);  
		  io.set("polling duration", 10);  

		  var path = require('path');  
		  var HTTPPolling = require(path.join(  
		    path.dirname(require.resolve('socket.io')),'lib', 'transports','http-polling')  
		  );  
		  var XHRPolling = require(path.join(  
		    path.dirname(require.resolve('socket.io')),'lib','transports','xhr-polling')  
		  );  

		  XHRPolling.prototype.doWrite = function(data) {  
		    HTTPPolling.prototype.doWrite.call(this);  

		    var headers = {  
		      'Content-Type': 'text/plain; charset=UTF-8',  
		      'Content-Length': (data && Buffer.byteLength(data)) || 0  
		    };  

		    if (this.req.headers.origin) {  
		      headers['Access-Control-Allow-Origin'] = '*';  
		      if (this.req.headers.cookie) {  
		        headers['Access-Control-Allow-Credentials'] = 'true';  
		      }  
		    }  

		    this.response.writeHead(200, headers);  
		    this.response.write(data);  
		    this.log.debug(this._name + ' writing', data);  
		  };  
		});




	}
	
	
	

	
	io.set('log level', options.socketioLogLevel);

	io.sockets.on('connection',

		function(client)
		{

			//console.log("Connected to client", client.id);
			
			clientHashList[client.id] = client;
			
			setTimeout(function()
			{
				//console.log("NOW")
				client.emit("firstcontact", {"tjena": "hello"})
			},1000);
			
		//	

			client.on('nunt',
				function(event)
				{

					//console.log("GOT MESSAGE", event);

					// create the evnet and add the sessionId
					// var event = JSON.parse(message);
					event.sessionId = client.id;

					if (!options.silent)
					{
						nunt.log("[RECEIVED (" + client.id + ")]:", event);
					}
					
				//	event.client = client;
					
					nunt.send(event);

				}
			);
			


			client.on('disconnect',
				function()
				{
					//	delete clientHashList[client.sessionId];
				/*	client.emit(json({
						announcement: client.sessionId + ' disconnected'
					}));
				*/
					var disconnectEvent = new nunt.DISCONNECTED(client.sessionId);
					disconnectEvent.sessionId = client.sessionId;
				
					nunt.send(disconnectEvent);
					
					delete cacheData[client.sessionId];
				
					if (options.disconnect && typeof options.disconnect == "function")
					{
						options.disconnect(client);
					}
				}
			);

		}
	);

	// we register a global listener (a listener that is called on all events
	// but we only run the code if the property "sendToClient" is set to true
	nunt.addGlobalListeners(
		function(event, client)
		{
			
			
			
			
			
			if (event.sendToClient || event.client)
			{
				
				if (event.client && typeof event.client != 'boolean')
				{
					throw "the event " + event._name + " had the event.client attribute not set as a boolean. this property is reserved for setting if the event should be sent to the client as well."
				}
				
				// clean internal props
				delete event.sendToClient;
				delete event.client;
				delete event.expose;
				
				
				// first we check if the cache options is enabled and no flag for not using the cache is set
    			if (options.cache && event.cache !== false && event.sessionId)
    			{
    			    // we serialize the data so that we can save it in the cache or just compare it to the cache in case we dont need to send it again
    			    if (cacheData[event.sessionId] && cacheData[event.sessionId][event._name])
    			    {
    			        var stringifiedData = JSON.stringify(event);
    			        if (cacheData[event.sessionId][event._name] == stringifiedData)
    			        {
    			            //console.log("ALREADY SENT");
    			            //console.log(event.sessionId + "-" + event._name);
    			            //console.log(cacheData[event.sessionId][event._name]);
    			            //console.log(stringifiedData);
    			            return;
    			        }
    			    }
    			}
				
				// if an event is meant to be sent to a client but has a session, we only send it to the client based on the sessionid, otherwise we broadcast to all
				if (event.sessionId)
				{
					// console.log(event.sessionId);
					// send the event to the corresponding client
					if (event.dontLog !== false && !options.silent) 
					{
						//nunt.log("[SENT (" + event.sessionId + ")]:", event);
						nunt.log("[SENT (" + event.sessionId + ")]:", event._name);
					}
					
					try
					{
			
						if (clientHashList[event.sessionId])
						{
						    
						    
						    

							clientHashList[event.sessionId].emit('nunt', event);
							
							// ok so if we have to use the cache, we make sure to save the lastes message
							if (options.cache && event.cache !== false)
                			{
							    var stringifiedData = stringifiedData || JSON.stringify(event);
							    cacheData[event.sessionId] = cacheData[event.sessionId] || {};
							    cacheData[event.sessionId][event._name] = stringifiedData;
							    //console.log("SAVE ", event.sessionId, event._name)
							}
						}
						else
						{
							delete clientHashList[event.sessionId];
						}
					}
					catch(err1)
					{
						nunt.log("ERROR WHEN SENDING TO SPECIFIC CLIENT (" + event.sessionId + "): ", err1);
						nunt.log("ERROR", event);
					}
				}
				else
				{
					// send the event to all clients
					try
					{
					    var stringifiedData = JSON.stringify(event);
					    
						for (var sessionId in clientHashList)
						{
						    
						    // check if alreay sent
						    // we serialize the data so that we can save it in the cache or just compare it to the cache in case we dont need to send it again
            			    if (cacheData[sessionId] && cacheData[sessionId][event._name])
            			    {
            			        if (cacheData[sessionId][event._name] == stringifiedData)
            			        {
            			            return;
            			        }
            			    }

                            // send the event
							clientHashList[sessionId].emit('nunt', event);
							
							// ok so if we have to use the cache, we make sure to save the lastes message
							if (options.cache && event.cache !== false)
                			{
							    cacheData[sessionId] = cacheData[sessionId] || {};
							    cacheData[sessionId][event._name] = stringifiedData;
							}
							
						}
					}
					catch(err2)
					{
						nunt.log("ERROR WHEN SENDING TO ALL: ", err2);
					}
				}
			}
		}
	);




	// this is used to map sessions with any key
	var mappedSessions = {};
	var hashSessions= {};
	
	// add a map object to nuntto map sessions
	nunt.mapSession = function(sessionId, key)
	{
		if (!mappedSessions[key])
		{
			mappedSessions[key] = [sessionId];
		}
		else
		{
			mappedSessions[key].push(sessionId);
		}
		hashSessions[sessionId] = key;
	}
	
	nunt.getMappedSessions = function(key)
	{
		return mappedSessions[key];
	}
	
	nunt.removedSessionId = function(sessionId)
	{
		var list = mappedSessions[hashSessions[sessionId]];

		if (list)
		{
			for(var i = 0, ii = list.length; i < ii; i++)
			{
				var entry = list[i];
				if (entry == sessionId)
				{
					list.splice(i, 1);
					return;
				}
			}
		}
	}
	
	
	
	
	

	/* the classes and events */
	nunt.controls.api = function()
	 {

		var self = this;

		var JSNameSpaces = {};
		
		nunt.on(nunt.events.server.api.BUILD_API_REQUEST, buildApi);

		function buildApi(event)
		{
		
			
			console.log("");
			nunt.log("Building JS API of exposed events:");

			var eventList = "/******************************************\n * This file is autocreated by the server *\n ******************************************/\n\n";
			eventList += "(function()\n{\n";
			eventList += "\n";

			var events = "";
			
			for (var i = 0, ii = event.scopeList.length; i < ii; i++)
			{
				events += buildApiRec(event.scopeList[i]);
			}

			eventList += events;

			eventList += "\n})();";
			
			createFolders(event.fileName);

			fs.writeFileSync(event.fileName, eventList, 'utf8');
			nunt.log("Building JS API -> Done!\n");
		}
		
		function createFolders(pathToCheck)
		{
		    pathToCheck = path.dirname(pathToCheck);
		    var pathParts = pathToCheck.split('/');
		    var pathToProcess = "";
		    for(var i = 0, ii = pathParts.length; i < ii; i++)
		    {
		        pathToProcess += pathParts[i] + "/"; 
		        var exists =  path.existsSync(pathToProcess);
		        if (!exists)
		        {
		            console.log("\tcreate folder " + pathToProcess);
		            fs.mkdirSync(pathToProcess, 0775);
		        }
		    }
		}
		

		function buildApiRec(container)
		{
			var eventList = "";
			for (var event in container)
			{

				if (typeof container[event] == "object")
				{
					eventList += buildApiRec(container[event]);
				}
				else if (typeof container[event] == "function")
				{
					var tempEvent = new container[event]();

					// is the event exposed to the client?
					if (tempEvent.expose)
					{
						var eventName = tempEvent._name;
						var eventDefinition = "nunt." + eventName + " = function(";
						
						
						//_bmvc.defineEvent("events.server.app.clientNrUpdated",["nrOfClients"],{expose:true, sendToClient: true})

						
						var defineString = 'nunt.defineEvent("' + eventName +  '",';

						var tempEvent = new container[event]();
						var hasProps = false;

						defineString += "[";
						
						var hasProps = false;
						
						for (var prop in tempEvent)
						{
							if ((prop != "_name") && (prop != "expose") && (prop != "sendToClient") && (prop != "request"))
							{
								defineString += '"' + prop + '",';
								hasProps = true;
							}
						}
			
						if (hasProps)
						{
							defineString = defineString.substring(0, defineString.length - 1);
						}
						
						defineString += ']';
						
						defineString += ',{';
						

						//eventDefinition += args + ")\n{\n";
						var hasDefaultProp = false;
						
						for (var prop in tempEvent)
						{
							
							if ((prop != "name") && (prop != "expose") && (prop != "sendToClient"))
							{
								
								
								if (typeof tempEvent[prop] == "boolean")
								{
									defineString += '"' + prop + '":';
									defineString += tempEvent[prop].toString() + ",";
									hasDefaultProp = true;
								}
								else if (typeof tempEvent[prop] == "string")
								{
									defineString += '"' + prop + '":';
									defineString += '"' + tempEvent[prop] + '",';
									hasDefaultProp = true;
								}
								else if (typeof tempEvent[prop] == "number")
								{
									defineString += '"' + prop + '":';
									defineString += tempEvent[prop] + ',';
									hasDefaultProp = true;
								}
								
								
							} 
						
						}
						if (hasDefaultProp)
						{
							defineString = defineString.substring(0, defineString.length - 1);
						}

						defineString += "});";

						eventList += "\t" + defineString + "\n";
						nunt.log("\t-> " + eventName);

					}
				}

			}
			return eventList;
		}

		function getNameSpace(functionName)
		{
			var nameSpace = functionName.substr(0, functionName.lastIndexOf("."));
			return nameSpace;
		}

		function createNameSpaceJSCode(nameSpace)
		{
			var nameSpaceCode = "";

			if (JSNameSpaces[nameSpace] === undefined)
			{
				nameSpaceCode += "nunt.addNamespace('" + nameSpace + "');\n\n";
				JSNameSpaces[nameSpace] = true;
			}

			return nameSpaceCode;
		}

	};


	/* ********************* */
	nunt.controls.connection = function()
	 {

		var self = this;
		
		self.on(nunt.CONNECTION_REQUEST, connectionRequested);

		// this is triggered when the client asks for a connection. if we dont get a request object, we return and ask for the cookie object.
		function connectionRequested(event)
		{


			if (options.connection && typeof options.connection == "function")
			{
				// do whatever we have to do in the connection callback
				options.connection(event.client);
			}
			
			var connectedEvent = new nunt.CONNECTED(true, event.sessionId, {});
			self.sessionId = event.sessionId;
			self.send(connectedEvent);

		}
		

		
		// this is used whenever we get a transport that dindt include cookies. the client wil make sure the cookies are sent and then we tell everyone we are connected
		function gotCookiesFromClient(e)
		{
			
			var fakeClientObject = {
				request: {
					headers: {
						cookie: e.cookies
					},
					url: ""
				},
				sessionId: e.sessionId,
				id: e.sessionId
			}
			
			//this is done to simulate the request object of a non websocket connection so that, for example, a fb client can read the cookie object
			if (!e.client.request)
			{
				e.client.request = fakeClientObject.request;
			}

			if (options.connection && typeof options.connection == "function")
			{
				
				//console.log("fakeClientObject, ", fakeClientObject)
				// do whatever we have to do in the connection callback
				options.connection(fakeClientObject);
			}
			
			// make sure we tell the client that everything is OK
			var connectedEvent = new nunt.CONNECTED(true, e.sessionId, {});
			self.sessionId = e.sessionId;
			self.send(connectedEvent);

		}


	};


	/* *********** events ********** */

	nunt.defineEvent("CONNECTION_REQUEST",[],{});
	nunt.defineEvent("CONNECTED",["info", "sessionId"],{sendToClient: true});
	nunt.defineEvent("DISCONNECTED",["sessionId"], {});
	nunt.defineEvent("events.server.api.BUILD_API_REQUEST",["scopeList", "fileName"], {});
	

}


exports.init = init;







