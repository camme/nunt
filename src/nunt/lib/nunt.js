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
    nunt.name = "nunt";
    
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
    };
     
    
    
    var sendForObjects = function(event)
    {
        nunt.send(event, this);
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
        var name = typeof event == 'string' ? event: getInstanceName(event);
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
        
        // to expose the private functions, we create a new function that goes trough the functions string
        // we could have done all string parsing in this class and only assosiate the functions directly with string manipulation here and not inside the new class,
        // but then we would have to expose the functions as strign in the code, which could lead to problems in the eval since string muight have semikolons, linebreaks etc
        var funcString = "";
//        funcString += "new (" + classAsString.substring(0, classAsString.length - 1);
        var functionRandomName = "tempFunction" + Math.random().toString().replace(".", "");
        funcString += "var " + functionRandomName + " = " + classAsString.substring(0, classAsString.length - 1);

        funcString += ";";
        funcString += "this._privates = {};\n";
        funcString += "this._initPrivates = function(f)\n";
        funcString += "{\n";
        funcString += "\tvar fs = f.toString();\n";
        funcString += "\tvar pf = fs.match(/function\\s*?(\\w.*?)\\(/g);\n";
        funcString += "\tthis._privates = {};\n";
        funcString += "\tfor (var i = 0, ii = pf.length; i < ii; i++)\n";
        funcString += "\t{\n";
        funcString += "\t\tvar fn = pf[i].replace(/(function\\s+)/, '').replace('(', '');\n";
        funcString += "\t\tthis._privates[fn] = eval(fn);\n";
        funcString += "\t}\n";
        funcString += "}\n";
        funcString += "\n\n};\n";
        funcString += functionRandomName + ".prototype.on = nunt.on;\n";
        funcString += functionRandomName + ".prototype.send = nunt.send;\n";
        funcString += "new " + functionRandomName + "();\n";

        //console.log(funcString);
        var instance = eval(funcString);
        
        instance._initPrivates(classAsString);
         
        // delete the initiation functions
        delete instance._initPrivates;

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

            // create a = function that returns a new exposed instance of the object
            classRef.getInstance =(function(classRef, name){
                return function()
                {
                    
                    // get an instance that exposes the provate funcions
                    instance = nunt.getExposedInstance(classRef);

                    //make sure it has the same functions as the rest
                    instance.send = classRef.prototype.emit = classRef.prototype.fire = sendForObjects;
                    instance.on = classRef.prototype.bind = classRef.prototype.addListener = onForObjects;
                    instance.off = classRef.prototype.unbind = classRef.prototype.removeListener = offForObjects;
                
                    return instance;
                    
                };
            })(classRef, name);
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
        instance.name = getInternalName(name, type);
        
        
        if (type)
        {
            instance.typeName = instance.name + "." + type;
            
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
            instance.typeName = instance.name;
        }
        
        allObjectsMap[instance.typeName] = instance;

        if (nunt.showLog)
        {
            console.log("nunt! Register ", instance.typeName);
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
        
        // only send events if we arent in test mode
        if (!nunt.unitTestMode || event._name == "nunt.READY")
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
                console.info("nunt! EVENT (sent from '" + sender.name + "'): " + eventName + " - ", event);
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
            
            // if we find listeners, loop trough them and send the event to the listening objects
            if (listeners)
            {
//                console.log("Nr of listeners for event '" + eventName + "'", listeners.length)
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
        }
        // if unit test mode we just save a list of all events snet with the arguments
        else
        {
            dispatchedEventListForTest.unshift({
                name: event,
                data: object
            })
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
        return dispatchedEventListForTest.length > 0 ? dispatchedEventListForTest[0] : null;
    }
    
    // creates events easely
    nunt.defineEvent = function(eventName, args, properties)
    {
        
        var nsName = eventName.substring(0, eventName.lastIndexOf("."));
        var eventLastName = eventName.replace(nsName, "").replace(".", "");

        var ns = nunt.addNamespace(nsName);
        
    
        
        ns[eventLastName] = function()
        {
            this.name = eventName;
            
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
    
    
})();
