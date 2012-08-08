/*
Author: Lonce Wyse
Date: July 2012
*/
/*
This code generatea a bank of sliders dynamically given a list of sound model parameter data.
(or any object that returns a list of elements in response to a getParamList() call that that look like this:
    [name, minval, maxval, value, function]
It creates a new window for a "player" GUI with sliders and text boxes to show values.
   To do that, it has to create the HTML code including element ID's used for setting up callbacks for slider changes.
   This code works with multi-word parameter names, too.

*/

// Create the GUI for sound model interaction and the callbacks for taking action
function makeSliderBox(i_sm){  // argument is a sound model 
	var i;
	var val;
	var controllerID, textID;
	var sliderelmt; // temp variable for shorhand
	var playingP=false;
	
	var myInterface = baseSM(); // yep, this GUI has the same interface as a base sound model.


	var params = i_sm.getParamList();
	//console.log("WHOLE paramlist = \n" + params.prettyString() + "\n-------------------");
	
	var h = 40 + 100 * params.length; // more sliders, longer window

	// Do it all in a new window
	if (! (typeof myWindow === 'undefined')) myWindow.close();  // close the old and create a new window each time this method is called.
	
	myWindow=window.open('','',"width=500,height=" + h );
	myWindow.document.title = "Lonce\'s Funky Parameter Slider Box";
	myWindow.document.write("Open developer tools console window to see \"play\" times. <br>");
	// Create the Play button
	myWindow.document.write(" <input id=\"playbutton_ID\" type=\"button\" value = \"Play\" /> ");	
	// Play button callback 
	myWindow.document.getElementById("playbutton_ID").addEventListener('click', function(){ 
		if (! playingP){
			myWindow.document.getElementById("playbutton_ID").value = "Release";
			// Call soundmodel method
			i_sm.play();
		} else {
			myWindow.document.getElementById("playbutton_ID").value = "Play";
			// Call soundmodel method
			i_sm.release();
		}
		playingP = ! playingP;		
	});
		
	// Now set up the parameters
	for (i=0;i<params.length; i++){
		myWindow.document.write(" <p> " + params[i].name + "</p> ");
		// create IDs to be used for change listener callbacks removing spaces in multi-word names 
		controllerID = params[i].name.replace(/\s+/g, '') + "_controllerID";
		textID   = params[i].name.replace(/\s+/g, '') + "_textID";
		

		if (params[i].type === "range") {

			val = Math.max(Math.min(params[i].value.max, params[i].value.val), params[i].value.min);
			
			// Generate slider GUI code: ----------------------
			// Output will look like this: <input id="foo_controllerID" type="range" min="0" max="1" step="0.01" value="0.1" style="width: 300px; height: 20px;" />	
			myWindow.document.write("<input id=\"" + controllerID + "\" type=\"range\" min=" + parseFloat(params[i].value.min) + " max="+ parseFloat(params[i].value.max) + " step=\"0.01\" value=" + parseFloat(val) +" style=\"width: 300px; height: 20px;\" />");	
			// Output will look like this: <input id="bar_textID" type="text" disabled="disabled" name="textfield" size=4 /> <br />
			myWindow.document.write("<input id=" + textID +   " type=\"text\" disabled=\"disabled\" value = " + parseFloat(val) + " name=\"textfield\" size=2 /> ");
			//  -----------------------------------------------
	
			
			// for each slider/text field pair, set up a callback to change the text field when the slider moves.
			// WARNING: COOL AND PROPERLY-WRITTEN CLOSURE CODE AHEAD ...
			sliderelmt = myWindow.document.getElementById(controllerID);
			
	
			sliderelmt.change = function(i_textID, paramfunc) {  // factory  to build a function that depends on the value of textID when the callback is set up, not the value of textID when the callback is called....
				var cb = function(){ 
					var sval = parseFloat(this.value);
					// ---------------  call the setParameter function of the sm
					paramfunc(sval); // jsbug - w/o parseFloat, when values are whole numbers, they can get passed as strings!!
					//console.log("about to set the text field " + i_textID + " to " + sval); // executes during callback
					myWindow.document.getElementById(i_textID).value = sval;
				}
				//console.log("returning the function to be passed to the event listener, " + cb); // executes during set-up of the callback
				return cb;
			}(textID, params[i].f) ;
			
			sliderelmt.addEventListener('change', sliderelmt.change);
	
			// Store the min and max value of the parameters so that we can properly set the sliders from normalized control message values
			// We dont need the default value or store a function to call - thus the two nulls
			myInterface.registerParam(
				sliderelmt,
				"range",
				{
					"min": params[i].value.min,
					"max": params[i].value.max,
					"val": null
				},
				null
			);
		} else if (params[i].type === "url") {
			myWindow.document.write("<input id=\"" + controllerID + "\" type=\"url\" value=\"Enter URL here\" style=\"width: 300px; height: 20px;\" />");
			//NOT IMPLEMENTING ATTACHED TEXT FIELD
			//...yet

			//NOT IMPLEMENTING THAT registerParam thing either
			//...again, yet
		}
	} // end for each parameter loop
		
	// Turn off sounds if window is closed
	myWindow.onbeforeunload = confirmExit;
	function confirmExit(){
		i_sm.release();
	}	
	
	myWindow.focus();
	
	//--------------------------------------------------------------------------------------------------------------
	// Now overide the methods of the sound model interface to push the buttons and move the sliders on this GUI
	//   (rather than call play and stop and change paramters directly)
	//    We do this so that programatic changes will be reflected in the gui as well as (through the gui) change the sound.
	//    To the caller, this API looks just like a sound model - except that they have to use setParamNorm rather than sound model specific parameter setting functions. 
	
	myInterface.play = function(){
		myWindow.document.getElementById("playbutton_ID").click(); void 0;
	};
	
	myInterface.release = function(){
		myWindow.document.getElementById("playbutton_ID").click(); void 0;
	};

//FIND A NEW WAY TO DO THIS!!!
//	myInterface.setParamNorm = function(i_pID, i_val){
//		var p;
//		var plist = myInterface.getParamList();
//		if (i_pID < plist.length){	
//			p=plist[i_pID];		
//			p[0].value=(p[1]+i_val*(p[2]-p[1]));   // pfunc(pmin+i_Val*(pmax-pmin)) // ... javascript makes me laugh
//			p[0].change(); // triggers the 
//		}
//	}
	
	return myInterface;
		
}

