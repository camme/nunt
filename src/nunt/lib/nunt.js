/**
 * nunt 3.1 by camilo tapia @camilotapia, www.onezerozeroone.com
 * nunt website www.nuntjs.com
 * 
 * History: this project eveolved from basicmvc in 2009 to _bmvc in 2010 to this in 2011. 
 * The basic functionality for it is an event listener and emitter, but it also has some small mvc pattern features.
 * It also provides an easy connection to nodejs trough socket.io. Both client and server code can listeen to the same event.
 */

(function()
{
    var undefined;

    // check if the container is the browser or node
    var isBrowser = (typeof global == "undefined") && (typeof require == "undefined"); // not the best test but ok now. global and require exists in node so we use it

    var container = isBrowser ? window : global;
    
    var registerAllObjectsHasRun = false; // in ie 7 sometimes the init methos are run twice so we use this ugly flag to fix that
    
    var nunt = isBrowser ? {} : exports;
    if (isBrowser)
    {
        window.nunt = nunt;
    }

    
    // internal name
    nunt._name = "nunt";
    
    // generel function for singletons
    var getInstance = function()
    {
        if (!this._instance)
        {
            this._instance = new this();
        }
        return this._instance;
    };
    
    var getInstanceName = function(eventRef)
    {
        var tempRef = new eventRef();
        var tempRefName = tempRef._name;
        return tempRefName;
    };
    
    // expose the get instance name function (for testing?)
    nunt.getInstanceName = getInstanceName;
    
    // show log if the location exists we check for the querystring 'log'
    if (container.location)
    {
        nunt.showLog = location.search.indexOf("log") != -1;
    }
    
    // this is where we will save all registred objects.
    nunt.objects = {};
    nunt.models = {};
    nunt.controls = {};
    nunt.views = {};
    
    var referenceToEventListeners = {};
    var objectsRegistred = false;
    var domReadyBound = false;
    var Types = {MODEL: "model", CONTROL: "control", VIEW: "view"};
    var allObjectsMap = {};
    var globalListeners = [];
    
    // this hodls a history of all events that are sent but is only used for testing
    var dispatchedEventListForTest = [];
    
   
    // are e in test mode?
    nunt.unitTestMode = false;
    
    // Some system events
    nunt.READY = function()
    {
        this._name = "nunt.READY";
        this.local = true;
    };
     
    nunt.getRegistredEvents = function()
    {
        return referenceToEventListeners;
    }
    
    var sendForObjects = function(event, data)
    {
        if (typeof event == "string")
        {
            nunt.send(event, data, this); 
        }
        else
        {
            nunt.send(event, this);
        }
    };
    
    var onForObjects = function(event, callback)
    {
        nunt.on(event, callback, this);
    };
    
    var offForObjects = function(event)
    {
        nunt.removeListener(event, callback, this);
    };
    
    // method for adding listeners
    // we can register a string or an event class
    nunt.on = function(event, handler, listeningObject)
    {
        
        // get the object that asks to listen, if non provided we get the from the caller (would prefer to have the instance but cant get it to work)
        if (!listeningObject)
        {
            listeningObject = arguments.callee.caller;
        }
        
        var name = typeof event == 'string' ? event : getInstanceName(event);
        if (!referenceToEventListeners[name])
        {
            referenceToEventListeners[name] = [];
        }
        
        referenceToEventListeners[name].push({handler: handler, listeningObject: listeningObject});
        
        return referenceToEventListeners;
    };
    
    // get all listeners for an event
    nunt.getListeners = function(event)
    {
        var name = typeof event == 'string' ? event: getInstanceName(event);
        if (!referenceToEventListeners[name])
        {
            referenceToEventListeners[name] = [];
        }
        
        return referenceToEventListeners[name];
    }
    
    // for checking if an event is handled by a specific callback
    nunt.hasListenerWithCallback = function(event, handler)
    {
        
        var listeners = nunt.getListeners(event);

        var hasListener = false;
        for(var i = 0, ii = listeners.length; i < ii; i++)
        {
            if (listeners[i].handler == handler)
            {
                hasListener = true;
                break;
            }
        }
        
        return hasListener;
    }
    
    // add global listeners
    nunt.addGlobalListeners = function(listener)
    {
        globalListeners.push(listener);
    };
    
    nunt.removeListener = function(event, listeningObject)
    {
        
        var name = typeof event == 'string' ? event: getInstanceName(event);
            
        if (!referenceToEventListeners[name])
        {
            referenceToEventListeners[name] = [];
        }
        
        var listeners = referenceToEventListeners[name];
        
        var newListeners = []; //listeners.slice(0);
        for(var i = 0, ii = listeners.length; i < ii; i++)
        {
            if (listeningObject != listeners[i].listeningObject)
            {
                newListeners.push(listeners[i]);
            }
        }
        referenceToEventListeners[name] = newListeners;
        
        return referenceToEventListeners[name];
    };
    
    
    
    
    
    function getInternalName(name, type)
    {
        var createdName = "";
        
        // if the instance doesnt have a name, we need it to register a name
        if (!name)
        {
            createdName = "_internal_name_" + Math.random().toString().replace(".", "") + "." + type;
        }
        else
        {
            createdName = name;
        }
        
        return createdName;
    }
    

    nunt.getExposedInstance = function(classRef)
    {
        
        // begin to change the class
        var classAsString = classRef.toString();
        
        // remove comments chunks in case they have functions
        classAsString = classAsString.replace(/\/\*(.|\n)*\*\//g, '');
        classAsString = classAsString.replace(/\/\/.+$/mg, '');
        
        // to expose the private functions, we create a new function that goes trough the functions string
        // we could have done all string parsing in this class and only assosiate the functions directly with string manipulation here and not inside the new class,
        // but then we would have to expose the functions as strign in the code, which could lead to problems in the eval since string muight have semikolons, linebreaks etc
        var funcString = "";
//      funcString += "new (" + classAsString.substring(0, classAsString.length - 1);
        var functionRandomName = "tempFunction" + Math.random().toString().replace(".", "");
        funcString += "var " + functionRandomName + " = " + classAsString.substring(0, classAsString.length - 1);

        funcString += "\t;\n";
        funcString += "\tthis._privates = {};\n";
        
        var allFunctions = classAsString.match(/function\s*?(\w.*?)\(/g);
        if(allFunctions && allFunctions.length > 0)
        {
            for (var i = 0, ii = allFunctions.length; i < ii; i++)
            {
                var fn = allFunctions[i].replace(/(function\s+)/, '').replace('(', '');
                funcString += "\tthis._privates['" + fn +"'] = " + fn + ";\n";
            }
        }
        
   
        /*funcString += "this._initPrivates = function(f)\n";
        funcString += "{\n";
        funcString += "\tvar fs = f.toString();\n";
        funcString += "\tvar pf = fs.match(/function\\s*?(\\w.*?)\\(/g);\n";
        funcString += "\tthis._privates = {};\n";
        funcString += "\tif(pf && pf.length > 0) {\n";
        funcString += "\tfor (var i = 0, ii = pf.length; i < ii; i++)\n";
        funcString += "\t{\n";
        funcString += "\t\tvar fn = pf[i].replace(/(function\\s+)/, '').replace('(', '');\n";
        funcString += "\t\tconsole.log('fn', fn); this._privates[fn] = eval(fn);\n";
        funcString += "\t}\n";
        funcString += "\t}\n";
        funcString += "}\n";*/
        funcString += "\n\n};\n";
        funcString += functionRandomName + ".prototype.on = nunt.on;\n";
        funcString += functionRandomName + ".prototype.send = nunt.send;\n";
        funcString += functionRandomName + "._tempId = '" + functionRandomName + "';\n";
        funcString += "new " + functionRandomName + "();\n";

        var instance = eval(funcString);
        
        //instance._initPrivates(classAsString);

        // this is only used for triggering the init event on the correct instance 
        instance._tempId = functionRandomName;
         
        // delete the initiation functions
        //delete instance._initPrivates;

        return instance;
    };
    
    
    // method for registring new functions
    nunt.register = function(classRef, name, type)
    {

        // add a new method to create singletons        
        classRef.getInstance = getInstance;

        var instance = null;

        // this is done to expose private functions
        // we create a new function inside the class trough some string manipulation, the we replace the original class with our new class with eval
        if (nunt.unitTestMode)
        {
            instance = {};

            // ******************  in unitest mode the objects arent initilized until we ask for them.
            // create a = function that returns a new exposed instance of the object
            (function(classRef, name, type){
                classRef.getInstance = (function(classRef, name, type){
                    return function()
                    {
                        
                        if (nunt.showLog)
                        {
                            console.log("nunt! Expose and register ", type, name);
                        }

                        // get an instance that exposes the provate funcions
                        instance = nunt.getExposedInstance(classRef);

                        //make sure it has the same functions as the rest
                        instance.send = classRef.prototype.emit = classRef.prototype.fire = sendForObjects;
                        instance.on = classRef.prototype.bind = classRef.prototype.addListener = onForObjects;
                        instance.off = classRef.prototype.unbind = classRef.prototype.removeListener = offForObjects;
                
                        // send the init event ut only to the new object
                        var listeners = referenceToEventListeners["nunt.READY"];
                
                        if (listeners)
                        {
                            for(var i = 0, ii = listeners.length; i < ii; i++)
                            {
                                var listeningObject = listeners[i].listeningObject;
                                
                                // we use a tempId since its the only way of knowing that the created object is the one listening as well
                                if (listeningObject._tempId == instance._tempId)
                                {
                                    listeners[i].handler.call(listeningObject, {_name:"nunt.READY"});
                                }
                            }
                        }
                
                        return instance;
                    
                    };
                })(classRef, name, type);
            })(classRef, name, type);
        }
        else
        {
            // add the send event method        
            classRef.prototype.send = classRef.prototype.emit = classRef.prototype.fire = sendForObjects;
            
            classRef.prototype.on = classRef.prototype.bind = classRef.prototype.addListener = onForObjects;
            
            classRef.prototype.off = classRef.prototype.unbind = classRef.prototype.removeListener = offForObjects;
            
            // create a new instance
            instance = classRef.getInstance();
        }
        
        
        
        // get the internal name
        instance._name = instance._name || getInternalName(name, type);
        
        
        if (type)
        {
            instance._typeName = instance.name + "." + type;
            
            if (type == Types.CONTROL)
            {
                instance.model = getObject(instance.name, Types.MODEL);
            }
            
            if (type == Types.VIEW)
            {
                instance.control = getObject(instance.name, Types.CONTROL);
                instance.model = getObject(instance.name, Types.MODEL);
            }
            
        }
        else
        {
            instance._typeName = instance._name;
        }
        
        allObjectsMap[instance._typeName] = instance;

        if (nunt.showLog)
        {
            console.log("nunt! Register ", instance._typeName);
        }
        
        // get the predefined listeners
        if (typeof instance.eventListeners == "function")
        {
            
            var listeners = instance.eventListeners();
        
            // if there is a list of event listeners, use it right now
            // if we are in unit test mode we dont send the events
            if (listeners && !nunt.unitTestMode)
            {
                for(var i = 0, ii = listeners.length; i < ii; i++)
                {
                    // get the current object...
                    var eventListenerObject = listeners[i];
                
                    // ...and register it
                     nunt.on(eventListenerObject.event, eventListenerObject.handler, instance);
                }
            }
        }
    };
    
    // add global listeners
    nunt.addGlobalListener = function(listener)
    {
        globalListeners.push(listener);
    };

    
    // method for sending events
    nunt.send = function(event, object, sender)
    {
        if (typeof event == 'string')
        {
            object = object || {};
            object._name = event;
            event = object;
        }
        else
        {
            sender = object;
        }

        var eventName = typeof event == 'string' ? event : event._name;    
    
        if(nunt.showLog)
        {
            sender = sender ? sender : {name: "_root"};
            console.info("nunt! EVENT (sent from '" + sender._name + "'): " + eventName + " - ", event);
        }
        
        // get all listeners
        var listeners =  referenceToEventListeners[eventName];
        
        // since some events are sent to the server, this doesnt have a purpose
        if(!listeners && nunt.showLog)
        {
            if(event._name != "nunt.READY")
            {
                //console.warn("nunt!: No listeners registred for event '" + event.name + "'");
            }
        }
        
        // here we save all events exept the init event in the log for testing, but only in test mode
        if (nunt.unitTestMode && event._name != "nunt.READY")
        {
            dispatchedEventListForTest.push({
                name: eventName,
                data: object
            });
        }
        
        // if we find listeners, loop trough them and send the event to the listening objects
        if (listeners)
        {
//          console.log("Nr of listeners for event '" + eventName + "'", listeners.length)
            for(var i = 0, ii = listeners.length; i < ii; i++)
            {
                var listeningObject = listeners[i].listeningObject;
                if(typeof event == 'string'){
                     listeners[i].handler.apply(this, Array.prototype.slice.call(arguments, 1));
                    //listeners[i].handler.call(listeningObject, arguments.slice(1));
                }
                else{
                    listeners[i].handler.call(listeningObject, event);
                }
            }
        }
        
        // go trough all global listeners if any
        for(var j = 0, jj = globalListeners.length; j < jj; j++)
        {
            var listeningObject2 = globalListeners[j];
            listeningObject2.call(listeningObject2, event);
        }
        
    };
    
    // return all dispatched events
    nunt.getDispatchedEvents = function()
    {
        return dispatchedEventListForTest;
    }
    
    // return all dispatched events
    nunt.getLatestDispatchedEvents = function()
    {
        return dispatchedEventListForTest.shift();
    }
    
    // creates events easely
    nunt.defineEvent = function(eventName, args, properties)
    {
        
        var nsName = eventName.substring(0, eventName.lastIndexOf("."));
        var eventLastName = eventName.replace(nsName, "").replace(".", "");

        var ns = nunt.addNamespace(nsName);
        
        
        ns[eventLastName] = function()
        {
            this._name = eventName;
            
            // defaults
            for(var prop in properties)
            {
                this[prop] = properties[prop];
            }
            
            for(var i = 0, ii = args.length; i < ii; i++)
            {
                if (arguments[i])
                {
                    this[args[i]] = arguments[i];                    
                }
                else
                {
                    this[args[i]] = null;
                }
            }
        };
        
    };
     
    // method to add namespaces
    nunt.addNamespace = function(namespaceString)
    {
        var currentNamespace = nunt;
        
        var nameStringParts = namespaceString.split(".");
        for (var i = 0, ii = nameStringParts.length; i < ii; i++)
        {
            if (nameStringParts[i] != "")
            {
                currentNamespace = currentNamespace[nameStringParts[i]] = currentNamespace[nameStringParts[i]] || {};
            }
        }
        
        return currentNamespace;
    };
    
    // extend an object (flat) with another
    nunt.extend = function(base, obj)
    {
        var newObj = {};
        for(var prop1 in base)
        {
            newObj[prop1] = base[prop1];
        }
        for(var prop2 in obj)
        {
            newObj[prop2] = obj[prop2];
        }
        return newObj;
    };
    
    
    function getObject(name, type)
    {
        return allObjectsMap[name + "." + type];
    }
    
    function registerAllObjects()
    {
       
        // if in browser, we put a special metatag so that debugging extension can recognize we are using it
        if (isBrowser)
        {
            if (!document.getElementById("usingNuntMarker"))
            {
                var nuntElement = document.createElement("meta");
                nuntElement.setAttribute("name", "nunt");
                nuntElement.setAttribute("content", "1");
                nuntElement.setAttribute("id", "usingNuntMarker");
                document.getElementsByTagName("head")[0].appendChild(nuntElement);
            }
        }
        
        // make sure we only run this once
        if (registerAllObjectsHasRun)
        {
            return;
        }
        registerAllObjectsHasRun = true;
        
        var obj;
        
        for (obj in nunt.objects)
        {
            nunt.register(nunt.objects[obj], obj);
            //delete nunt.objects[obj];
        }
        
        for (obj in nunt.models)
        {
            nunt.register(nunt.models[obj], obj, Types.MODEL);
            //delete nunt.models[obj];
        }
        
        for (obj in nunt.controls)
        {
            nunt.register(nunt.controls[obj], obj, Types.CONTROL);
            //delete nunt.controls[obj];
        }
        
        for (obj in nunt.views)
        {
            nunt.register(nunt.views[obj], obj, Types.VIEW);
            //delete nunt.views[obj];
        }
        
        objectsRegistred = true;
        
        // everything is ready, lets send the signal to the system
        nunt.send(new nunt.READY(), nunt);
        
    }
    
    // resets the objects in nunt. used mostly for testing
    nunt.reset = function()
    {
        registerAllObjectsHasRun = false;
        
        referenceToEventListeners = {};
        objectsRegistred = false;
        allObjectsMap = {};
        globalListeners = [];
        dispatchedEventListForTest = [];
        
        registerAllObjects();
    }
    
    /*
     * options is for ndoe in case we want run a server 
     */
    function init(options)
    {
        
        // only init like this if we are in the browser. in node, we just register the objects
        if (isBrowser)
        {
        
            // make sure we only do this once
            if (domReadyBound)
            {
                return;
            }
        
            domReadyBound = true;
        
            // if we can use addeventlistener
            if (document.addEventListener) 
            {        
                // Use the handy event callback
                document.addEventListener("DOMContentLoaded", 
                    function()
                    {
                        // remove it again
                        document.removeEventListener("DOMContentLoaded", arguments.callee, false);

                        // register
                        registerAllObjects();    

                    }, false);
            
            }
            else
            {
                // if ie
                if (document.attachEvent) 
                {
                    // ensure firing before onload,
                    // maybe late but safe also for iframes
                    document.attachEvent("onreadystatechange", 
                        function()
                        {
                            if (document.readyState === "complete") 
                            {
                                document.detachEvent("onreadystatechange", arguments.callee);
                                registerAllObjects();    
                            }
                        }
                    );    
                
                    //if ie and not iframe
                    if (document.documentElement.doScroll && container == container.top)
                    (
                        function()
                        {
                            if (objectsRegistred)
                            {
                                return;
                            }
                        
                            try {
                                // If IE is used, use the trick by Diego Perini
                                // http://javascript.nwbox.com/IEContentLoaded/
                                document.documentElement.doScroll("left");
                            }
                            catch (error) 
                            {
                                setTimeout(arguments.callee, 0);
                                return;
                            }
                        
                        // and execute any waiting functions
                        registerAllObjects();
                    })();
                }
            }
        
        }
        else
        {
            if (options)
            {
                // dont connect the server if in unit test mode
                if (options.server)
                {
                    nunt.server = require("./nunt.server");                    
                    nunt.server.init(options.server.server, options.server.options);
                } 
            
                
            }
            registerAllObjects();
        }
    }
    
    // EXTRA FUNCTIONS
    nunt.map = function(list, fn)
    {
        var result = [];
        for (var i = 0, ii = list.length; i < ii; i++)
        {
            result.push(fn(list[i]));
        }
        return result;
    };

    nunt.forEach = function(list, fn)
    {
        var result = [];
        for (var i = 0, ii = list.length; i < ii; i++)
        {
            var itemResult = fn(list[i], i);
            if (itemResult)
            {
                result.push(itemResult);
            }
        }
        return result;
    };

    nunt.forEachDelay = function(list, fn, time, orgLength)
    {
        orgLength = orgLength ? orgLength : list.length;
        var self = this;
        var index = orgLength - list.length;
        var item = list.shift();
        fn(item, index);
        if (list.length > 0)
        {
            setTimeout(
                function()
                {
                    self.forEachDelay(list, fn, time, orgLength);
                }, time
            );
        }
    };
    
    if (isBrowser)
    {
        // this is if want to register it manually
        if (!nunt.unitTestMode)
        {
            init();
        }
        nunt.init = registerAllObjects;
        
    }
    else
    {
        nunt.init = init;
    }
    
    //-only for nodejs-
	
	if ((typeof window == "undefined") && exports)
	{
	
		var fs = require('fs');
		var path = require('path');
	
		// this methods are for loading all modules in paths
		nunt.loadPaths = function(paths)
		{
			console.log("");
			nunt.log("Loading external modules:");
			for (var i = 0, ii = paths.length; i < ii; i++)
			{
				loadModule(paths[i]);
			}
			nunt.log("Loading external modules -> Done!\n");
		};

		function loadModule(startPath)
		{
			if (path.existsSync(startPath))
			{
				var files = fs.readdirSync(startPath);
				for (var i = 0, ii = files.length; i < ii; i++)
				{
					var currentFile = startPath + "/" + files[i];

					var fileStat = fs.statSync(currentFile);
					if (fileStat.isDirectory())
					{
						loadModule(currentFile);
					}
					else
					{
						if (currentFile.match(/\.js$/))
						{
							var moduleName = currentFile.substring(0, currentFile.length - 3);
							require(currentFile);
							nunt.log("\tLoaded module -> " +  moduleName);			
						}
					}
				}
			}
		}
	
	
		/* colors */
	
		// useful colors for bash
		var colors = {
			black: "\x1b[0;30m",
			dkgray: "\x1b[1;30m",
			brick: "\x1b[0;31m",	
			red: "\x1b[1;31m",
			green: "\x1b[0;32m",	
			lime: "\x1b[1;32m",
			brown: "\x1b[0;33m",	
			yellow: "\x1b[1;33m",
			navy: "\x1b[0;34m",	
			blue: "\x1b[1;34m",
			violet: "\x1b[0;35m",	
			magenta: "\x1b[1;35m",
			teal: "\x1b[0;36m",	
			cyan: "\x1b[1;36m",
			ltgray: "\x1b[0;37m",	
			white: "\x1b[1;37m",
			reset: "\x1b[0m"
		};
	
	
	
		// this methos is for logging messages with a little more info
		nunt.log = function(message, content)
		{
			var currentDate = new Date();
			var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0]; 

			if (content == undefined)
			{
				console.log("[" + dateString + "]: " + message);
			}
			else
			{
				console.log("[" + dateString + "]: " + message + "\t" + JSON.stringify(content));
			}

		};
	
		nunt.error = function(message, content)
		{
			var currentDate = new Date();
			var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0]; 

			if (content == undefined)
			{
				nunt.log(colors.red + "[" + dateString + "]: " + message + colors.reset);
			}
			else
			{
				nunt.log("[" + dateString + "]: " + message + "\t" + JSON.stringify(content) + colors.reset);
			}

		};
	
		// this methos is for logging messages with a little more info
		nunt.log.color = function(color, message, content)
		{
			var currentDate = new Date();
			var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0]; 

			if (content == undefined)
			{
				console.log("[" + dateString + "]: " + colors[color] + message + colors.reset);
			}
			else
			{
				console.log("[" + dateString + "]: " + colors[color] + message + "\t" + JSON.stringify(content) + colors.reset);
			}

		};
	
	}
	
	//-end of only for nodejs-
    
})();
