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
                nuntPanel.reset();
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
    var sh = window.SyntaxHighlighter;
    var document = window.document;
    var eventListElement = $("#eventsList");

    this.displayLists = function()
    {
    
        runScript("window.nunt._getRegistredEventsAsStringList()", function(objects) {
           displayObjectList(objects, eventListElement, "")
        });
    
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
    
                var eventItem = eventItems[i];
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
    
            }
            return handlerNameList;
        }

        runScript("window.nunt._getCallbackFromEvent = " + _getCallbackFromEvent.toString());
    
    }
    
    this.addScripts();
    
    
    function displayObjectList(objects, container, prefix)
    {
        // empty it
        container.html("");

        for(obj in objects)
        {
            var element = $("<li id='" + obj + "'>" + prefix + obj + "</li>");
            element.click(eventClick);
            container.append(element);
        }
    }
    
    this.reset = function()
    {
        $("#eventInfo .innerContent").addClass("disabled");
        $("#codeInner > div, #codeInner pre").remove();
        $("#callbackList").empty();
        container.html("");
    }
    
    
    var callbackList = null;
    function eventClick()
    {
        
        var event = $(this).attr("id");
        
        runScript("window.nunt._getCallbackFromEvent('" + event + "')", function(result) {
            
            callbackList = result;
            
            $("#eventInfo .innerContent").removeClass("disabled");
            
            var listDom = $("#callbackList").empty();
            
            for(var i = 0, ii = result.length; i < ii; i++)
            {
                listDom.append("<option value='" + i + "'>" + result[i].functionName + "</option>")
            }
    
            if (result.length > 0)
            {
                showCallback(result[0]);
            }
            
            listDom.unbind("change").bind("change", function(){
                
                var index = parseInt($("#callbackList").val());
                showCallback(callbackList[index]);
            });
            
        });
    }
    
    function showCallback(callbackItem)
    {
        //$("#callbackName .content").html(result[0].functionName);
        $("#codeInner > div, #codeInner pre").remove();
        var pre = $('<pre class="brush: js">');
        $("#codeInner").append(pre);
        pre.html(callbackItem.functionString.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"));
        sh.highlight();
        
        $("#file .content").html();
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