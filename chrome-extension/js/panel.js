chrome.experimental.devtools.panels.create(
    "Nunt",
    "media/icons_24.png",
    "html/panel.html",
    init
);

var window = null;
var objectList;
var eventList;

var createdDom = false;
var nuntPanel;
var nuntExists = false;

var that = this;
function init(panel)
{
    chrome.experimental.devtools.inspectedWindow.eval(
        "typeof window.nunt",
         function(result, isException) 
         {
           if (isException && result != "undefined")
           {
            nuntExists = false;
            }
           else
           {
               nuntExists = true;
           }
         }
    );

    panel.onShown.addListener(show);
}

function gotMessage(request, sender, sendResponse) 
{
    console.log("got command", request.command)
    if (request.command == 'reload')
    {
    
    }
  

  
}

chrome.extension.onRequest.addListener(gotMessage);



var nuntLoaded = false;
var eventSrcFiles = {};

function refresh(resource)
{
    
    if (resource.type == "document")
    {
        runScript("(window.nunt != null);", function(result){ 
            if (result)
            {
                nuntLoaded = true;
                nuntPanel.addScripts();
                nuntPanel.displayLists();
            }
            else
            {
                nuntLoaded = false;
                eventSrcFiles = {};
            }
        });
    }
    else
    {
        if (resource.type == "script")
        {
            resource.getContent(function(content){
                analyzeCode(content, resource.url);
            });
            
        }
    }
}

function analyzeCode(code, name)
{
    var matches = code.match(/\.(on|bind)\(.+("|'|)/igm);
    if (matches.length > 0)
    {
        for(var i = 0, ii = matches.length; i < ii; i++)
        {
            var event = matches[i];
            if (event != "")
            {
                
                var trimmed = event.replace(/\.(on|bind)/gi, "").replace(/["';\(]/gi, "").replace(/,.+\)/gi, "");
                if (!eventSrcFiles[trimmed])
                {
                    eventSrcFiles[trimmed] = [];
                }
                eventSrcFiles[trimmed].push({
                    file: name,
                    content: content
                });

            }
        }
    }
    
}

chrome.experimental.devtools.inspectedWindow.onResourceAdded.addListener(refresh);


function show(window) 
{
    if (!nuntPanel)
    {
        nuntPanel = new NuntPanel(window);
        //setInterval(nuntPanel.displayLists, 1000);
    }
    
    nuntPanel.displayLists();

}

function NuntPanel(window)
{
    var window = window;
    var $ = window.jQuery;
    var document = window.document;
    var eventListElement = document.getElementById("eventsList");
    /*var modelsListElement = document.getElementById("modelsList");
    var controlsListElement = document.getElementById("controlsList");
    var viewsListElement = document.getElementById("viewsList");
    var objectsListElement = document.getElementById("objectsList");*/
    
    
    
    
    this.displayLists = function()
    {
    
        runScript("window.nunt._getRegistredEventsAsStringList()", function(objects) {
           displayObjectList(objects, eventListElement, "")
        });
    
        /*runScript("window.nunt.models", function(objects) {
           displayObjectList(objects, modelsListElement, "models.")
        });
    
        runScript("window.nunt.controls", function(objects) {
           displayObjectList(objects, controlsListElement, "controls.")
        });
    
        runScript("window.nunt.views", function(objects) {
           displayObjectList(objects, viewsListElement, "views.")
        });
    
        runScript("window.nunt.objects", function(objects) {
           displayObjectList(objects, objectsListElement, "objects.")
        });*/
    
    }
    
    this.addScripts = function()
    {
    
    
        
                
        // add script to get list of events
        runScript("window.nunt._getRegistredEventsAsStringList = function(){ var list = this.getRegistredEvents(); var stringList = {}; for(var eventName in list) {stringList[eventName] = 1;}; return stringList };");

        var _getCallbackFromEvent = function(event)
        {
            var eventItems = this.getRegistredEvents()[event]; 
            var findNameRe = /function (\w+\((.|)+\))/;
            var handlerNameList = [];
            for(var i = 0, ii = eventItems.length; i < ii; i++)
            {
    
                var eventItem = eventItems[0];
                var functionString = eventItem.handler.toString();
        
                // handler
                var handlerNameMatches = findNameRe.exec(functionString);
                var handlerName = "";
                if (handlerNameMatches.length > 0)
                {
                    handlerName = handlerNameMatches[1];
                }
        
                handlerNameList.push({
                    functionName: handlerName,
                    functionString: functionString
                });
        
                // listeningObject
        
                //console.log(eventItem)
    
            }
            return handlerNameList;
        }

        //console.log("window.nunt._getCallbackFromEvent = " + _getCallbackFromEvent.toString())
        runScript("window.nunt._getCallbackFromEvent = " + _getCallbackFromEvent.toString());
        
   
    
    }
    
    this.addScripts();
    
    
    function displayObjectList(objects, container, prefix)
    {
        // empty it
        container.innerHTML = "";

        for(obj in objects)
        {
          
            var element = $("<li id='" + obj + "'>" + prefix + obj + "</li>");
            element.click(eventClick);
            $(container).append(element);
        }
    }
    
    function eventClick()
    {
        //console.log("eventSrcFiles", eventSrcFiles)
        var event = $(this).attr("id");
        
        runScript("window.nunt._getCallbackFromEvent('" + event + "')", function(result) {
            
            $("#file .content").html();
            $("#event .content").html(event);
            $("#callbackName .content").html(result[0].functionName);
            $("#callbackCode .content").html(result[0].functionString.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"));
            
            console.log(eventSrcFiles, event)
            
            //console.log('event:', event);
            //console.log('callbacks:', result);
            //console.log('file:', eventSrcFiles[event].file);
        });
    }
    
}


function runScript(script, callback)
{
    (function(script, callback){
    chrome.experimental.devtools.inspectedWindow.eval(
        script,
        function(result, isException) 
        {
            if (!isException)
            {
                return callback(result);
            }
            else
            {
                console.error("ERR:", script, result);
                return callback(null);
            }
         }
    );
    })(script, callback);
}
function updateElementProperties()
{
    console.log("selected");
}

function nuntFound(panel)
{
    
}