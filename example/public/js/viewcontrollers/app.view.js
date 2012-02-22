(function(nunt){
    
    nunt.views.app = function()
    {
        var that = this;
        
        this.on(nunt.CONNECTED, connected);
        this.on("model.nrOfClients.updated", nrOfClientsUpdated);
        
        nunt.on("foo.update", fooUpdate);
        
        function fooUpdate()
        {
            console.log("FOOO")
        }
        
        function connected(event)
        {
            $("#message").html("connected!");
            $("#messageExtra").html("session id " + event.sessionId);
        }
        
        function nrOfClientsUpdated(event)
        {
            $("#showNrOfClients").empty();
            
            for (var i = 0, ii = event.amount; i < ii; i++)
            {
                var item = $("<div class='clientRep'></div>");
                $("#showNrOfClients").append(item);
                item.click(function(){
                    nunt.send("tjena.nunt", {datamaskin: 1})
                })
            }
        }
        
    };

})(nunt);


$(document).ready(function(){
    
    nunt.on("foo.update", datamaskin);
    
    function datamaskin()
    {
        console.log("FOOO Datamaskin");
    }
    
});


