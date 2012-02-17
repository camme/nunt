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
           if (isException)
           {
            nuntExists = false;
            }
           else
           {
               nuntExists = true;
           }
         }
    );
    
    chrome.experimental.devtools.inspectedWindow.eval(
        "window",
         function(result, isException) 
         {
           console.log(result, isException)
         }
    );
    
    panel.onShown.addListener(show);
}


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
    var document = window.document;
    var eventListElement = document.getElementById("eventsList");
    var modelsListElement = document.getElementById("modelsList");
    var controlsListElement = document.getElementById("controlsList");
    var viewsListElement = document.getElementById("viewsList");
    var objectsListElement = document.getElementById("objectsList");
    
    
    
    this.displayLists = function()
    {
    
        runScript("window.nunt.getRegistredEvents()", function(objects) {
           displayObjectList(objects, eventListElement, "event: ")
        });
    
        runScript("window.nunt.models", function(objects) {
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
        });
    
    }
    
    function displayObjectList(objects, container, prefix)
    {
        // empty it
        container.innerHTML = "";

        for(obj in objects)
        {
            var element = document.createElement("li");
            element.innerText = prefix + obj;
            container.appendChild(element);
        }
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