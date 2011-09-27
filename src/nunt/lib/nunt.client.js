(function(nunt){
	
	
	/* default url config */ 
	var base = {url: "localhost", autoConnect: true, port: 8080 };

	var options = null;


	nunt.defineEvent("CONNECTION_REQUEST",[],{});
	nunt.defineEvent("CONNECTED",["sessionId", "info"],{sendToClient: true});
	nunt.defineEvent("DISCONNECTED",["sessionId"], {});
	nunt.defineEvent("ASK_FOR_COOKIES_FROM_CLIENT", [], {sendToClient: true});
	nunt.defineEvent("SEND_COOKIES_FROM_CLIENT", ["cookies"], {request: true});
	nunt.defineEvent("events.server.api.BUILD_API_REQUEST",["scopeList", "fileName"], {});
	
	// and the actual control
	nunt.controls.connection = function()
	{


		var that = this;
		
		options = nunt.extend(base, nunt.eventServerConfig);
		
		this.eventListeners = function()
		{
			if (options.autoConnect)
			{
				return [
					{event: nunt.READY, handler: initConnection}
				];
			}
			else
			{
				return [
					{event: nunt.CONNECT, handler: initConnection}
				];
			}
		};
		
		this.on(nunt.ASK_FOR_COOKIES_FROM_CLIENT, getCookieDataForSocket);
		
		// get cookie data and send it to the server. this is used if we are using a transport in socket io that doesnt give us access to the request object, and therefore the cookies
		function getCookieDataForSocket(e)
		{
			var cookieEvent = new nunt.SEND_COOKIES_FROM_CLIENT(document.cookie);
			that.send(cookieEvent);
			//console.log(cookieEvent);
		}
		
		function initConnection()
		{
		
				var url = options.url;
				
				delete options.url;
				delete options.port;
		
				that.socket = io.connect(url, options);
				
		
				that.socket.on('nunt', 
					function(event)
					{						
						onServerEvent(event);
					}
				);    
				
				that.socket.on('connect', 
					function(data)
					{
						var event = new nunt.CONNECTION_REQUEST();	
						that.socket.emit('nunt', event);
					}
				);
	
				that.socket.on('disconnect', 
					function(data)
					{
						var event = new nunt.DISCONNECTED(data);	
						that.send(event);
					}
				);
	      
				nunt.addGlobalListener(
					function(event)
					{					
					
						if (event.request)
						{
							// clean internal props before sending;
							delete event.request;
							
							//console.log("SEND!", event)
						
							// send to server
							that.socket.emit('nunt', event);
						}
					}
				);
			
			//	that.socket.connect();
			
				$(window).unload(function() {
					that.socket.disconnect();
				});
			
		/*	}
			catch(err)
			{
				console.log("No connection to server or ", err);
			}*/
			
		}
		
		function sendToServer(event)
		{
			that.socket.send(event);
		}
		
		function onServerEvent(event)
		{
			that.send(event);
		}
			
	};

})(nunt);


	
