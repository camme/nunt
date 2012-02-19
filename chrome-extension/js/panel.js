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



function refresh(resource)
{
    if (resource.type == "document")
    {
        nuntPanel.addScripts();
        nuntPanel.displayLists();
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
    //
    console.log("hello")
    console.log(window.jQuery == null, window.$ == null);
    var $ = window.jQuery;
    console.log("hello 2", $.toString())
    var document = window.document;
    var eventListElement = document.getElementById("eventsList");
    var modelsListElement = document.getElementById("modelsList");
    var controlsListElement = document.getElementById("controlsList");
    var viewsListElement = document.getElementById("viewsList");
    var objectsListElement = document.getElementById("objectsList");
    
    
    
    this.displayLists = function()
    {
    
        runScript("window.nunt._getRegistredEventsAsStringList()", function(objects) {
           displayObjectList(objects, eventListElement, "event: ")
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
        
        runScript("window.nunt._getCallbackFromEvent = function(event){ var eventItem = this.getRegistredEvents()[event]; var callback = eventItem[0].handler; return calback; };");
        
    
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
            console.log(obj)
            $(container).append(element);
            //var element = document.createElement("li");
            //element.innerText = prefix + obj;
            //element
            //container.appendChild(element);
        }
    }
    
    function eventClick()
    {
        var event = $(this).attr("id");
        console.log(event + " clicked");
        
        runScript("window.nunt._getCallbackFromEvent('" + event + "')", function(result) {
            
           console.log(result);
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