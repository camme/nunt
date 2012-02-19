// triggered when content is reloaded
chrome.extension.sendRequest(
    {
        command: "reload"
    }, function(response) {}
);
