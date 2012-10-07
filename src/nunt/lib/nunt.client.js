(function(nunt){

    /* default url config */ 
    var base = {url: "localhost", autoConnect: true};

    var endPoint = location.protocol + "//" + location.hostname;
    if (location.port != "80") {
        endPoint += ":" + location.port;
    }
    base = {url: endPoint, autoConnect: true};

    var options = null;

    // and the actual control
    nunt.controls.connection = function() {

        var that = this;

        // this makes sure it is displayed correclty if logginf
        this._name = "server";

        options = nunt.extend(base, nunt.eventServerConfig);

        this.on("nunt.READY", initConnection);
        this.on("nunt.CONNECT", initConnection);

        function initConnection() {

            var url = options.url;

            var resourceRe = /\/\/.+?(\/.+)$/gi;
            var match = resourceRe.exec(url);
            if (match && match.length > 1) {
                options.resource = match[1] + "/socket.io";
                url = url.replace(match[1], "");
            }

            delete options.url;
            delete options.port;

            that.socket = io.connect(url, options);

            that.socket.on('nunt', function(event) {
                onServerEvent(event);
            });

            that.socket.on('connect', function(data) {
                var event = new nunt.CONNECTION_REQUEST();    
                that.socket.emit('nunt', event);
            });

            that.socket.on('disconnect', function(data) {
                var event = new nunt.DISCONNECTED(data);
                that.send(event);
            });

            nunt.addGlobalListener(function(event) {

                if (event.local !== true && event._local !== true) {

                    if (event.server && typeof event.server != 'boolean') {
                        throw "the event " + event._name + " had the event.server attribute not set as a boolean. this property is reserved for setting if the event should be sent to the server as well."
                    }

                    // clean internal props before sending;
                    delete event.request;
                    delete event.server;

                    // send to server
                    that.socket.emit('nunt', event);
                }
            });

            $(window).unload(function() {
                that.socket.disconnect();
            });

        }

        function sendToServer(event) {
            that.socket.send(event);
        }

        function onServerEvent(event) {
            event._local = true;
            that.send(event);
        }

    };

})(nunt);
