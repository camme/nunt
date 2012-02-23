// triggered when content is reloaded
chrome.extension.sendRequest(
    {
        command: "reloaded"
    }, function(response) {}
);


var devToolsTabId = -1;

/*
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    console.log("CONTENT SCRIPT", request.command)
    if (request.command == 'setDevTabId')
    {
        console.log(sender)
    }
});*/


document.addEventListener('nuntEvent', function(e){ 
    if (e.type == "nuntEvent")
    {
        //console.log("NUNT", e, arguments)
        chrome.extension.sendRequest({command: "nuntEvent", e: e.srcElement.getAttribute("data-nunt")});
  
        //console.log("skicka", e)
       // port.postMessage({command: "tjena", values: "1"});
        //chrome.tabs.sendRequest(1424, {command: "hello"})
        //console.log("skickat")
    }
    // TODO send to panel
    //console.log("nuntTrigger in contentscript", e)
}, false);

//console.log(tabId)
// check messages from system
/*
function gotMessage(request, sender, sendResponse) 
{
    console.log("CS got command", request.command)
    if (request.command == 'reloaded')
    {
        
    }
}

// whenever a message is sent
chrome.extension.onRequest.addListener(gotMessage);

*/