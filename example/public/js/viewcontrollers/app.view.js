(function(nunt){
    
    nunt.views.app = function()
    {
        console.log("PRE YES")
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
                $("#showNrOfClients").append($("<div class='clientRep'></div>"));
            }
        }
        
    };

})(nunt);


$(document).ready(function(){
    
    console.log("YES")
    nunt.on("foo.jquery.update", fooUpdate);
    
    function fooUpdate()
    {
        console.log("FOOO")
    }
    
});


