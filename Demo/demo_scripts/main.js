/*
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/* "Install" the jsaSound code by putting the 4 jsaSound direcories: jsaCore, jsaModels, jsaOpCodes, and scripts in to your working directory.
	Pass in the jsaModels that you want to play using the Require protocol as shown below.
*/

require.config({
	paths: {
		"jsaSound": ".."
	}
});
require(
	["require", "http://animatedsoundworks.com/soundServer/jsaModels/jsaFM"], 
	//["require", "localhost:8080/jsaModels/jsaFM"], // WHY CANT I LOAD SOUNDs FROM LOCALHOST WHEN I RUN A SERVER THERE??
	//["require", "jsaSound/jsaModels/jsaFM"], // This loads a model from a local directory
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
			
			snd.setRangeParamNorm(0, normX );  // setting by parameter index 
			snd.setRangeParamNorm("Modulation Index", normY); // setting by parameter name 
		};
	}
);