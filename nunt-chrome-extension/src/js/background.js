var contentTabId = -1;
var developTabId = -1;
var port = -1;
var eventList = [];
var nuntDebuggerExtension = "";
const tab_log = function(json_args) {
  var args = JSON.parse(unescape(json_args));
  console[args[0]].apply(console, Array.prototype.slice.call(args, 1));
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {

    if (request.command == 'sendToConsole')
    {
          /*chrome.pageAction.setPopup({
              tabId: sender.tab.id,
              popup: "html/debugger.html"
          });
          chrome.pageAction.show(sender.tab.id);
          //sendResponse({});
      }
      else{*/
          var args = JSON.parse(unescape(request.args));
          console[args[0]].apply(console, Array.prototype.slice.call(args, 1));
       
    }
    else if(request.command == "setContentTabId")
    {
//        console.log("tab id", request.tabId, sender)
        contentTabId = request.tabId;
        developTabId = sender.tab.id;
        nuntDebuggerExtension = sender.id;
        
       
          
       // port = chrome.tabs.connect(developTabId, {name: "knockknock"});
        //console.log("created port")
        
    }
    else if (request.command == 'reloaded')
    {
        if (developTabId > 0 )
        {
           // chrome.tabs.sendRequest(developTabId, {command: "reloaded"});
        }
    }
    
    else if (request.command == 'nuntEvent')
    {
        eventList.push(request.e);
    }
    
    else if (request.command == "getEvent")
    {
        var nuntEventString = eventList.shift();
        if (nuntEventString)
        {
            var nuntEvent = JSON.parse(nuntEventString);
            sendResponse(nuntEvent);
        }
    }
  

  
});








