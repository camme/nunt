var nunt = require('./nunt');
var log = nunt.log;
var isMiddleware = false;
var nuntOptions = null;
var fs = require('fs');
var path = require('path');

nunt.middleware = function () {
    return function(req, res, next) {
        if (req.path.indexOf('/nunt/nunt.js') > -1) {
            isMiddleware = true;
            sendNuntJS(res);
        }
        else {
            next();
        }

    };
}

function sendNuntJS(res) {
    var file = require.resolve('./nunt');
    var nuntJs = fs.readFileSync(file, 'utf8');
    nuntJs = nuntJs.replace(/-only for nodejs-[.\w\W]*?-end of only for nodejs-/gi, "");
    var findConfigRe = /\/\* default url config \*\/((.|\t|\r|\n)*?);/gi;
    var clientCofig = "var base = {url: '" + nuntOptions.url + "', autoConnect: " + nuntOptions.autoConnect + "}; ";
    nodeJs = nuntJs.replace(findConfigRe, clientCofig);
    if (!isMiddleware) {
//        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(nuntJs);
    }
    else {
        //res.header('Content-Type', 'application/javascript');
        res.end(nuntJs);
    }
}

function init(options) {

    if (!options.server){
        throw "The nunt socket io server needs an app to know where to run";
    }

    /* default config */
    var baseOptions = {
        autoConnect: true,
        url: 'localhost',
        handlers: [],
        socketioLogLevel: 0,
        silent: false,
        fakeSocket: false,
        cache: true
    };

    var options = nunt.extend(baseOptions, options);
    nuntOptions = options;

    var cacheData = {};
    var server = options.server;
    var log = global.log;

    // where to read the html files

    var url = require('url');
    var io = options.io || null;

    try {
        io = require('socket.io');
    }
    catch(err) {

        console.log("I'm sorry but you are trying to use nunt for server <--> client communication");
        console.log("but socket.io isnt installed. Please run 'npm install socket.io' and start again");

        sys.exit(1);

    }

    var nodePath = require('path'),
    sys = require('util'),
    querystring = require('querystring');

    if (!isMiddleware) {
        server.on('request', function(req, res) {
            if (req.url.indexOf('/nunt/nunt.js') > -1) {
                sendNuntJS(res);
            }
        });
    }

    var buffer = [],
    json = JSON.stringify,
    socketIOOPtions = {},
    io = io.listen(server),
    clientHashList = {};

    nunt.log.color("magenta", "Socket server started. Happy socketing!");

    if (options.fakeSocket) {

        /* ************************************************** */
        /*      special just to make it work behind nginx     */
        /* ************************************************** */

        io.configure(function() {
            io.set("transports", ["xhr-polling"]);
            io.set("polling duration", 10);

            var path = require('path');
            var HTTPPolling = require(path.join(path.dirname(require.resolve('socket.io')),'lib', 'transports','http-polling'));  
            var XHRPolling = require(path.join(path.dirname(require.resolve('socket.io')),'lib','transports','xhr-polling'));  

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

    // if we have set a callback for authorization, lets add it here
    if (options.authorization) {
        io.set('authorization', options.authorization);
    }

    io.sockets.on('connection', function(client) {

        clientHashList[client.id] = client;

        // run a callback if there is one
        if (options.connect && typeof options.connect == "function") {
            options.connect(client);
        }

        // this event is triggered whenever a client is connected
        nunt.send(nunt.CLIENT_CONNECTED, {_client: client, sessionId: client.id, local: true});

        client.on('nunt', function(event) {

            event.sessionId = client.id;

            if (!options.silent) {
                nunt.log("[RECEIVED (" + client.id + ")]:", event);
            }

            // this event is sent before the event is sent further in the system. it gives one the chance to do something with it
            nunt.send(nunt.INCOMMING_PRE_SEND, {event: event, local: true, client: client});

            event._client = client;
            event._local = true;
            nunt.send(event);

        });

        client.on('disconnect', function() {

            var disconnectEvent = {};
            disconnectEvent.sessionId = client.id;
            disconnectEvent.local = true;

            delete cacheData[client.id];
            delete clientHashList[client.id];

            nunt.send('nunt.DISCONNECTED', disconnectEvent);

            if (options.disconnect && typeof options.disconnect == "function") {
                options.disconnect(client);
            }
        });

    });

    // we register a global listener (a listener that is called on all events
    // but we only run the code if the property "sendToClient" is set to true
    nunt.addGlobalListeners(function(event, client) {

        //console.log(event)
        if (event.local !== true && event._local !== true) {

            if (event.client && typeof event.client != 'boolean') {
                throw "the event " + event._name + " had the event.client attribute not set as a boolean. this property is reserved for setting if the event should be sent to the client as well."
            }

            // clean internal props
            delete event.sendToClient;
            delete event.client;
            delete event.expose;

            // first we check if the cache options is enabled and no flag for not using the cache is set
            if (options.cache && event.cache !== false && event.sessionId) {
                // we serialize the data so that we can save it in the cache or just compare it to the cache in case we dont need to send it again
                if (cacheData[event.sessionId] && cacheData[event.sessionId][event._name]) {
                    var stringifiedData = JSON.stringify(event);
                    if (cacheData[event.sessionId][event._name] == stringifiedData) {
                        //console.log("ALREADY SENT");
                        //console.log(event.sessionId + "-" + event._name);
                        //console.log(cacheData[event.sessionId][event._name]);
                        //console.log(stringifiedData);
                        return;
                    }
                }
            }

            // if an event is meant to be sent to a client but has a session, we only send it to the client based on the sessionid, otherwise we broadcast to all
            if (event.sessionId) {
                // console.log(event.sessionId);
                // send the event to the corresponding client
                if (event.dontLog !== false && !options.silent) {
                    //nunt.log("[SENT (" + event.sessionId + ")]:", event);
                    nunt.log("[SENT (" + event.sessionId + ")]:", '_name: ' + event._name);
                }

                try {

                    if (clientHashList[event.sessionId]) {

                        clientHashList[event.sessionId].emit('nunt', event);

                        // ok so if we have to use the cache, we make sure to save the lastes message
                        if (options.cache && event.cache !== false) {
                            var stringifiedData = stringifiedData || JSON.stringify(event);
                            cacheData[event.sessionId] = cacheData[event.sessionId] || {};
                            cacheData[event.sessionId][event._name] = stringifiedData;
                            //console.log("SAVE ", event.sessionId, event._name)
                        }
                    }
                    else {
                        delete clientHashList[event.sessionId];
                    }
                }
                catch(err1) {
                    nunt.log("ERROR WHEN SENDING TO SPECIFIC CLIENT (" + event.sessionId + "): ", err1);
                    nunt.log("ERROR", event);
                }
            }
            else {
                // send the event to all clients
                try {

                    var stringifiedData = JSON.stringify(event);

                    // send the event
                    if (event.dontLog !== false && !options.silent) {
                        //nunt.log("[SENT (" + event.sessionId + ")]:", event);
                        var jsonPayload = JSON.stringify(event).substring(0, 50).replace(/"/g, "'");
                        nunt.log("[SENT (TO ALL)]:", jsonPayload);
                    }

                    for (var sessionId in clientHashList) {

                        // check if alreay sent
                        // we serialize the data so that we can save it in the cache or just compare it to the cache in case we dont need to send it again

                        if (cacheData[sessionId] && cacheData[sessionId][event._name]) {
                            if (cacheData[sessionId][event._name] == stringifiedData) {
                                nunt.log("[CACHED]");
                                return;
                            }
                        }

                        clientHashList[sessionId].emit('nunt', event);

                        // ok so if we have to use the cache, we make sure to save the lastes message
                        if (options.cache && event.cache !== false) {
                            cacheData[sessionId] = cacheData[sessionId] || {};
                            cacheData[sessionId][event._name] = stringifiedData;
                        }

                    }
                }
                catch(err2) {
                    nunt.log("ERROR WHEN SENDING TO ALL: ", err2);
                }
            }
        }
    });

    // this is used to map sessions with any key
    var mappedSessions = {};
    var hashSessions= {};

    // add a map object to nuntto map sessions
    nunt.mapSession = function(sessionId, key) {
        if (!mappedSessions[key]) {
            mappedSessions[key] = [sessionId];
        }
        else {
            mappedSessions[key].push(sessionId);
        }
        hashSessions[sessionId] = key;
    }

    nunt.getMappedSessions = function(key) {
        return mappedSessions[key];
    }

    nunt.removedSessionId = function(sessionId) {
        var list = mappedSessions[hashSessions[sessionId]];

        if (list) {
            for(var i = 0, ii = list.length; i < ii; i++) {
                var entry = list[i];
                if (entry == sessionId) {
                    list.splice(i, 1);
                    return;
                }
            }
        }
    }



    /* ********************* */
    nunt.controls.connection = function() {

        var self = this;

        self.on('nunt.CONNECTION_REQUEST', connectionRequested);

        // this is triggered when the client asks for a connection. if we dont get a request object, we return and ask for the cookie object.
        function connectionRequested(event) {

            if (options.connection && typeof options.connection == "function") {
                // do whatever we have to do in the connection callback
                options.connection(event.client);
            }

            self.sessionId = event.sessionId;
            self.send('nunt.CONNECTED', {sessionId: event.sessionId} );

        }

        // this is used whenever we get a transport that dindt include cookies. the client wil make sure the cookies are sent and then we tell everyone we are connected
        function gotCookiesFromClient(e) {

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
            if (!e.client.request) {
                e.client.request = fakeClientObject.request;
            }

            if (options.connection && typeof options.connection == "function") {
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

}

exports.init = init;


