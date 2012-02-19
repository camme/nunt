var nunt = require('nunt');

nunt.models.app = function()
{
    
    var self = this;
    var clients = {};
    var nrOfClients = 0;

    // define listeners
    nunt.on(nunt.CONNECTED, clientConnected);
    nunt.on(nunt.DISCONNECTED, clientDisonnected);
    
    // define callbacks
    function clientConnected(e)
    {
        clients[e.sessionId] = true;
        countClients();
    }
    
    function clientDisonnected(e)
    {
        delete clients[e.sessionId];
        countClients();
    }
    
    function countClients()
    {
        var nrOfClients = 0;
        for(client in clients)
        {
            nrOfClients++;
        }
        self.send("model.nrOfClients.updated", {amount: nrOfClients});
    }
    

    
}

