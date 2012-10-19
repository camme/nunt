(function(nunt){
    
    
    /* default url config */ 
    var base = {url: "localhost", autoConnect: true};

    var options = null;


    nunt.defineEvent("CONNECTION_REQUEST",[],{});
    nunt.defineEvent("CONNECTED",["sessionId", "info"],{sendToClient: true});
    nunt.defineEvent("DISCONNECTED",["sessionId"], {local: true});
    nunt.defineEvent("ASK_FOR_COOKIES_FROM_CLIENT", [], {sendToClient: true});
    nunt.defineEvent("SEND_COOKIES_FROM_CLIENT", ["cookies"], {request: true});
    nunt.defineEvent("events.server.api.BUILD_API_REQUEST",["scopeList", "fileName"], {});
    
    // and the actual control
    nunt.controls.connection = function()
    {


        var that = this;
        
        // this makes sure it is displayed correclty if logginf
        this._name = "server";
        
        options = nunt.extend(base, nunt.eventServerConfig);
        
        this.on("nunt.READY", initConnection);
        this.on("nunt.CONNECT", initConnection);
        
        function initConnection()
        {
        
                var url = options.url;
                
                var resourceRe = /\/\/.+?(\/.+)$/gi;
                var match = resourceRe.exec(url);
                if (match && match.length > 1)
                {
                    options.resource = match[1] + "/socket.io";
                    url = url.replace(match[1], "");
                }
                
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
                        if (event.local !== true && event._local !== true)
                        {
                            if (event.server && typeof event.server != 'boolean')
                            {
                                throw "the event " + event._name + " had the event.server attribute not set as a boolean. this property is reserved for setting if the event should be sent to the server as well."
                            }
                            // clean internal props before sending;
                            delete event.request;
                            delete event.server;
                            
                            //console.log("SEND!", event)
                        
                            // send to server
                            that.socket.emit('nunt', event);
                        }
                    }
                );
            
            //    that.socket.connect();
            
                $(window).unload(function() {
                    that.socket.disconnect();
                });
            
        /*    }
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
            event._local = true;
            that.send(event);
        }
            
    };

})(nunt);


    
