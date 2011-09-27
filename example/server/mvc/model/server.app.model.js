var nunt = require('nunt');

nunt.models.app = function()
{
	
	var self = this;
	var nrOfClients = 0;

	// define listeners
	nunt.on(nunt.CONNECTED, clientConnected);
	nunt.on(nunt.DISCONNECTED, clientDisonnected);
	

	// define callbacks
	function clientConnected()
	{
		nrOfClients++;
		self.send(new nunt.events.server.app.CLIENT_NR_UPDATED(nrOfClients));
	}
	
	
	function clientDisonnected()
	{
		nrOfClients--;
		self.send(new nunt.events.server.app.CLIENT_NR_UPDATED(nrOfClients));		
	}
	

	
}

