require.config({
	paths: {
		"jsaSound": ".."
	}
});
require(
	["require", "http://animatedsoundworks.com/soundServer/jsaModels/jsaFM"],
		function (require, sndFactory) {

		// First create the sound model from the factory.
		var snd = sndFactory();

		// Parameter names are used for setting the parameter values. The names are availabe like this:
		// You can also see the parameter names in the sliderBox browser app that comes with jsaSound for playing sounds.
		console.log("The sound has " + snd.getNumParams() + " parameters :");
		for(var i=0;i<snd.getNumParams();i++){
			console.log("snd param #" + i + " is named " + snd.getParamNames()[i]);
		}

		/* The play(), release(), stop(), and parameter setting with setRangeParamNorm() can be tied to
			any event or object in your javascript code. Here we use simple mouse events and motion.
			*/

		// play the sound
		window.onmousedown=function(){
			snd.play();
		};
		// release the sound sending it into its decay segmen (use stop() if you want to stop the sound abruptly)
		window.onmouseup=function(){
			snd.release();
		};

		// Setting sound parameters, in this case using normalized values (in [0,1]), and getting parameters by index number.
		window.onmousemove=function(e){
			var normX = e.clientX/window.innerWidth;
			var normY = e.clientY/window.innerWidth;
			snd.setRangeParamNorm(snd.getParamNames()[0], normX );
			snd.setRangeParamNorm(snd.getParamNames()[1], normY);
		};
	}
);