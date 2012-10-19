nunt.views.positions = function() {

    var that = this;
    var mouse = {x: -1, y: -1};
    var mouseOld = {x: -1, y: -1};

    nunt.on(nunt.CONNECTED, begin);

    $(document).mousemove(function(e){
        mouse.x = e.pageX;
        mouse.y = e.pageY;
    }); 

    function begin()
    {
        // begin to ready the maouse corrdinates
        setInterval(readMouse, 1000);
    }

    function readMouse()
    {
        if (mouseOld.x != mouse.x || mouseOld.y != mouse.y) {
            that.send("client.mouse", mouse);
            mouseOld.x = mouse.x;
            mouseOld.y = mouse.y;
        }
    }

};
