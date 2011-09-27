(function(nunt){
	
	nunt.views.app = function()
	{
		
		var that = this;
		
		this.on(nunt.CONNECTED, connected);
		this.on(nunt.events.server.app.CLIENT_NR_UPDATED, nrOfClientsUpdated);
		
		function connected(event)
		{
			$("#message").html("connected!");
			$("#messageExtra").html("session id " + event.sessionId);
		}
		
		function nrOfClientsUpdated(event)
		{
			$("#showNrOfClients").empty();
			
			for (var i = 0; i < event.nrOfClients; i++)
			{
				$("#showNrOfClients").append($("<div class='clientRep'></div>"));
			}
		}
		
	};

})(nunt);







