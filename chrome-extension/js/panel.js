var dev = chrome.experimental.devtools;

// make sure well tell the world where the dev tool tab id is
// TODO: Is this really used?
chrome.extension.sendRequest({
    command: "setDevToolsId",
    tabId: chrome.experimental.devtools.tabId
});

// create actual panel
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
var tabId = -1;


// whenever a resource is loaded, we have to check it
chrome.experimental.devtools.inspectedWindow.onResourceAdded.addListener(resouceAdded);

// if the page is reloaded, we reset everything
chrome.experimental.devtools.onReset.addListener(resetNuntInspector);

// whenever a message is sent
chrome.extension.onRequestExternal.addListener(gotMessage);


  // check messages from system
  function gotMessage(request, sender, sendResponse) 
  {
      console.log("got command", request.command)
      if (request.command == 'reloaded')
      {

      }
  }


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

chrome.extension.getViews().forEach(function(view){
  console.log(view)
});



chrome.extension.onConnect.addListener(function(port) {
  //console.assert(port.name == "nunt");
  console.log("port", port.name)
  port.onMessage.addListener(function(msg) {
    if (msg.joke == "Knock knock")
      port.postMessage({question: "Who's there?"});
    else if (msg.answer == "Madame")
      port.postMessage({question: "Madame who?"});
    else if (msg.answer == "Madame... Bovary")
      port.postMessage({question: "I don't get it."});
  });
});



function resetNuntInspector()
{
    eventSrcFiles = {};
    nuntPanel.reset();
    nuntPanel.addScripts();
    nuntPanel.displayLists();
}

var nuntLoaded = false;
var eventSrcFiles = {};

var scriptList = {};

// analyze the code and pick out scripts and event handlers
function analyzeCode(code, file)
{

    scriptList[file] = code;
    
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
                    file: file,
                    content: content
                });
                console.log("FILE", file)
            }
        }
    }
    
}

 var port = chrome.extension.connect({name: "knockknock"});
function resouceAdded(resource)
{
    
    
    // if its a document we check if nunt is loaded
    if (resource.type == "document")
    {
        runScript("(window.nunt != null);", function(result){ 
            if (result)
            {
                nuntLoaded = true;
                nuntPanel.addScripts();
                nuntPanel.displayLists();
                nuntPanel.setNuntListener();
            }
        });
    }
    else if (resource.type == "script")
    {
        (function(resource){
            resource.getContent(function(content){
                analyzeCode(content, resource.url);
            });
        })(resource)
    }
    
    

}

function checkResources(list)
{
    for(var i = 0, ii = list.length; i < ii; i++)
    {
        var resource = list[i];
        if (resource.type == "script")
        {
            (function(resource){
                resource.getContent(function(content){
                    console.log(content)
                    analyzeCode(content, resource.url);
                })(resource);
            });
            
        }
    }
}

function show(window) 
{
    chrome.experimental.devtools.inspectedWindow.getResources(checkResources);
    
    if (!nuntPanel)
    {
        nuntPanel = new NuntPanel(window);   
    }
    
    nuntPanel.addScripts();
    nuntPanel.displayLists();
    nuntPanel.setNuntListener();
}


var interval = 0;

function NuntPanel(window)
{
    var that = this;
    var window = window;
    var $ = window.jQuery;
    var sh = window.SyntaxHighlighter;
    var document = window.document;
    var eventListElement = $("#eventsList");
    
   
    this.setNuntListener = function()
    {
        
        //console.log("TRY TO chrome.extension.sendRequest", chrome.experimental.devtools.inspectedWindow.tabId)
        chrome.extension.sendRequest({command: "setContentTabId"});
        
        clearInterval(interval);
        
        interval = setInterval(function(){
            //console.log("check")
            chrome.extension.sendRequest({command: "getEvent"}, function(data){
                
                var cloneOfData = JSON.parse(JSON.stringify(data));
                var container = $("#triggeredEventsList");
                
                var eventDom = $("<li class='triggeredEventItem'><div class='eventItemInner'><span class='time'></span><span class='name'></span><span class='data'></span><span class='tag server'>s</span></div></li>");
                
                container.prepend(eventDom);


                // calculate event time
                var time = new Date(data._time);
                var milli = time.getMilliseconds();
                milli = milli < 10 ? '00' + milli : milli;
                milli = milli < 100 ? '0' + milli : milli;
                var timeToDisplay = (time.getHours() < 10 ? '0' + time.getHours() : time.getHours()) + ":" + (time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes()) + ":" + milli;
                 
                delete cloneOfData._name;
                delete cloneOfData._local;
                delete cloneOfData.local;
                delete cloneOfData._time;

                eventDom.attr("data-event", data._name);
                eventDom.find(".name").html(data._name);
                eventDom.find(".data").html(JSON.stringify(cloneOfData));
                eventDom.find(".time").html(timeToDisplay + ":");
                if (data._local)
                {
                    eventDom.find(".server").show();
                }
                
                // bind the click if the user wants more info
                eventDom.click(eventClick);

            });
        }, 50);
        
    }


    this.displayLists = function()
    {
    
        runScript("if (window.nunt._getRegistredEventsAsStringList) { window.nunt._getRegistredEventsAsStringList(); }", function(objects) {
           displayObjectList(objects, eventListElement, "")
        });
    
    }
    
    this.addScripts = function()
    {

        // add script to get list of events
        
        runScript("typeof window.nunt._getRegistredEventsAsStringList != 'undefined';", function(exists){
            if (!exists)
            {
                var script = "";
                
                script += "window.nunt._getRegistredEventsAsStringList = function(){ var list = this.getRegistredEvents(); var stringList = {}; for(var eventName in list) {stringList[eventName] = 1;}; return stringList }; ";
                

                var _getCallbackFromEvent = function(event)
                {
                    var eventItems = this.getRegistredEvents()[event]; 

                    if (eventItems)
                    {

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
                    return null;
                }

                script += "window.nunt._getCallbackFromEvent = " + _getCallbackFromEvent.toString();


                var _globalListener = function(e)
                {
                    if (e._name)
                    {


                        var hiddenDiv = document.getElementById("usingNuntMarker");

                        // create a time object to show the time in the console
                        e._time = (new Date()).getTime();
                        hiddenDiv.setAttribute("data-nunt", JSON.stringify(e));
                        //hiddenDiv.dispatchEvent(customEvent);

                        //console.log("GOT NUNT EVENT, SEND IT AS domEvent")
                        var evt = document.createEvent('Event');

                        //evt.data = JSON.stringify(e);
                        //evt.detail = JSON.stringify(e);
                        //evt.nuntData = JSON.stringify(e);
                        //evt.innerText = evt.detail = JSON.stringify(e);
                        evt.initEvent('nuntEvent', true, false, e);  
                        hiddenDiv.dispatchEvent(evt);
                        //console.log("sent", e)
                    }
                }

                script += "; if (typeof window.nunt._globalListener == 'undefined') { window.nunt._globalListener = " + _globalListener.toString() + "; window.nunt.addGlobalListeners(window.nunt._globalListener); console.log('ADDINNNGG')}; "
                
                runScript(script, function(){
                    that.displayLists();
                });

                //console.log(chrome.experimental.devtools.inspectedWindow.tabId)
                //chrome.tabs.sendRequest(chrome.experimental.devtools.inspectedWindow.tabId, {command: "setDevTabId"}, function(r){console.log(r)});
                //console.log("YES")
            }
            else
              {
                that.displayLists();
              }
            
        });
        
    
    }
    
    this.addScripts();
    
    
    function displayObjectList(objects, container, prefix)
    {
        // empty it
        container.html("");

        for(obj in objects)
        {
            var element = $("<li id='" + obj + "' data-event='" + obj +"'>" + prefix + obj + "</li>");
            element.click(eventClick);
            container.append(element);
        }
    }
    
    this.reset = function()
    {
        $("#eventInfo .innerContent").addClass("disabled");
        $("#codeInner > div, #codeInner pre").remove();
        $("#callbackList").empty();
        container.html("Checking events...");
    }
    
    
    var callbackList = null;
    function eventClick()
    {
        
        var event = $(this).attr("data-event");
        
        runScript("window.nunt._getCallbackFromEvent('" + event + "')", function(result) {
           
            if (result)
            {
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
            } 
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
        
        var foundInFile = "Please reload page to get this to work...";
        for(var file in scriptList)
        {
            var index = scriptList[file].indexOf(callbackItem.functionString);
            if (index > -1)
            {
                foundInFile = file;
                
                var before = scriptList[file].substring(0, index - 1).replace(/\r/g, "");
                var countN = before.match(/\n/gm);
                foundInFile += "#" + countN.length + "";
            }
            
        }
        
        $("#file .content").html(foundInFile);
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


