## nunt

Superlightweight event system for javascript. Easy to use just in the client, easy to use on the server and seamless communication between both. If you like to create event based apps, this is for out.

Look at the example to see how easy it works

## install under nodejs

npm install nunt

## use on client not using nodejs

	<script type="text/javascript" src="/js/lib/nunt.js"></script>

## quick example (in browser, nodejs is slightly different)

	(function(nunt){
		nunt.controls.foo = function()
		{

			var that = this;

			// listen to events
			nunt.on("foo.update", update);
			nunt.on(nunt.READY, ready);

			// when we get an update event, we show the result. in this case, if its cake day
			function ready(event)
			{
				console.log("all systems go!");
			}

			function update(event)
			{
				console.log("update event triggered. event:  ", event);		
			}
			
			$(document.body).click(function(){
				nunt.send("foo.update", {"bar": true});
			});

		};
	})(nunt);
	
## more info soon

Watch this space for a better introduction to nunt

## License 

(The MIT License)

Copyright (c) 2011 Camilo Tapia &lt;camilo.tapia@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.