if (document.getElementById("usingNuntMarker"))
{
    console.log("yes");
    chrome.extension.sendRequest({}, function(response) {});
}