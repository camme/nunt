

const tab_log = function(json_args) {
  var args = JSON.parse(unescape(json_args));
  console[args[0]].apply(console, Array.prototype.slice.call(args, 1));
}

chrome.extension.onRequest.addListener(function(request, sender) {
  if (request.command !== 'sendToConsole')
  {
      chrome.pageAction.setPopup({
          tabId: sender.tab.id,
          popup: "html/debugger.html"
      });
      chrome.pageAction.show(sender.tab.id);
      //sendResponse({});
  }
  else{
    
  chrome.tabs.executeScript(request.tabId, {
      code: "("+ tab_log + ")('" + request.args + "');",
  });
  }
});


function clicked(tab)
{
    chrome.tabs.executeScript(null, {code: "alert(window.nunt)"});
    alert("run");
}

chrome.pageAction.onClicked.addListener(clicked);





