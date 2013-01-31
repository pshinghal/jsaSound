/* --------------------------------------------------------------------------------------- 
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
 ------------------------------------------------------------------------------------------*/
/* 
Author: Lonce Wyse
Date: July 2012
 */
/* 
This code generates a bank of sliders dynamically given a list of sound model parameter data.
(or any object that returns a list of elements in response to a getParams() call that look like this:
    {type, value{min, max, val}, function}
It creates a new window for a "player" GUI with sliders and text boxes to show values.
   To do that, it has to create the HTML code including element ID's used for setting up callbacks for slider changes.
   This code works with multi - word parameter names, too.
 */

// Create the GUI for sound model interaction and the callbacks for taking action
define(
	["jsaSound/jsaCore/baseSM", "jsaSound/jsaCore/utils"],
	function (baseSM, utils) {
		//console.log("returning sliderBox constructor");
		return function (i_sm) {  // argument is a sound model
			var i;
			var val;
			var controllerID, textID;
			var controllerElement;
			var controllerButton;
			var playingP = false;

			// This is the interface that will be returned by this factory method
			var myInterface = baseSM();
			//console.log("myInterface is of type " + typeof myInterface);
			// yep, this GUI has the same interface as a base sound model : play, release, and registerParam!

			var params = i_sm.getParams();
			//console.log("in sliderbox, sm params has length " + utils.objLength(params) + ", and = " + params);
			var numParams = utils.objLength(params);

			var h = 100 + 70 * numParams; // more sliders, longer window

			// Do it all in a new window
			// close the old and create a new window each time this method is called.
			var myWindow = {};
			myWindow = window.open('', '', "width = 400,height = " + h);
			myWindow.document.write("<link href=\"css/sliderBox.css\" rel=\"stylesheet\" type=\"text/css\">");
			myWindow.document.title = "jsaSound Parameter Slider Box";
			if (i_sm.getAboutText() !== "") {
				myWindow.document.write("<div id=\"aboutTextID\"></div>");  //so it can be styled
				myWindow.document.getElementById("aboutTextID").innerHTML = i_sm.getAboutText();
			}


			function setupRangeParameter(paramObject, paramName) {
				// Fit value into the min-max range
				var val = Math.max(Math.min(paramObject.value.max, paramObject.value.val), paramObject.value.min);

				// Generate slider GUI code:
				// Output will look like this: <input id = "foo_controllerID" type = "range" min = "0" max = "1" step = "0.01" value = "0.1" style = "width: 300px; height: 20px;" />
				myWindow.document.write("<input id = \"" + controllerID + "\" type = \"range\" min = " + parseFloat(paramObject.value.min) + " max = " + parseFloat(paramObject.value.max) + " step = \"0.01\" value = " + parseFloat(val) + " style = \"width: 300px; height: 20px;\" />");

				// Output will look like this: <input id = "bar_textID" type = "text"  name = "textfield" size = 4 /> <br />
				myWindow.document.write("<input id = " + textID +   " type = \"text\"  value = " + parseFloat(val) + " name = \"textfield\" size = 2 /> ");

				// For each slider/text field pair, set up a callback to change the text field when the slider moves.
				// WARNING: COOL AND PROPERLY - WRITTEN CLOSURE CODE AHEAD ...
				controllerElement = myWindow.document.getElementById(controllerID);

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.change = (function (i_textID, paramFunc) {
					var cb = function () {
						var sval = parseFloat(this.value);
						//Set the parameter in the SM
						paramFunc(sval); // jsbug - w/o parseFloat, when values are whole numbers, they can get passed as strings!!
						myWindow.document.getElementById(i_textID).value = sval;
					};
					return cb;
				}(textID, paramObject.f));

				controllerElement.addEventListener('change', controllerElement.change);

				// Store the min and max value of the parameters so that we can properly set the sliders from normalized control message values
				// We dont need the default value or store a function to call - thus the two nulls
				//console.log("in sliderbox, registering interface param " + controllerElement);
				myInterface.registerParam(
					controllerID, //controllerElement,
					"range",
					{
						"min": paramObject.value.min,
						"max": paramObject.value.max,
						"val": null
					},
					//TODO: this is bloody confusing. Why was this initially "null"??
					null
				);
				//console.log("in sliderbox, interface now has  " + utils.objLength(myInterface.getParams()) + " registered elements" );

			}

			function setupUrlParameter(paramObject, paramName) {
				myWindow.document.write("<input id = \"" + controllerID + "\" type = \"url\" value = \"" + paramObject.value.val + "\" style = \"width: 300px; height: 20px;\" />");
				myWindow.document.write("<input id = \"" + controllerID + "_button\" type = \"button\" value = \"Load\" style = \"width: 50px; height: 20px;\" />");
				controllerElement = myWindow.document.getElementById(controllerID);
				controllerButton = myWindow.document.getElementById(controllerID + "_button");

				//TODO: Check if it might be better to separate this as a factory function
				controllerElement.change = (function (paramfunc) {
					var cb = function () {
						paramfunc(controllerElement.value);
					};
					return cb;
				}(paramObject.f));

				controllerButton.addEventListener('click', controllerElement.change);
				//NOT IMPLEMENTING THAT registerParam thing... yet
			}

			function setupParameter(paramObject, paramName) {
				myWindow.document.write(" <div  class = \"paramName\" > " + paramName + "</div> ");
				// create IDs to be used for change listener callbacks removing spaces in multi - word names
				//TODO LOW: This 'reduction' of the name can create issues:
				controllerID = paramName.replace(/\s+/g, '') + "_controllerID";
				textID   = paramName.replace(/\s+/g, '') + "_textID";

				switch (paramObject.type) {
				case "range":
					setupRangeParameter(paramObject, paramName);
					break;
				case "url":
					setupUrlParameter(paramObject, paramName);
					break;
				default:
					throw "setupParameter: Parameter type " + paramObject.type + " does not exist";
				}
			}


			// Create the Play button
			myWindow.document.write(" <input id = \"playbutton_ID\" type = \"button\" value = \"Play\" /> ");
			// Play button callback
			myWindow.document.getElementById("playbutton_ID").addEventListener('click', function () {
				if (!playingP) {
					myWindow.document.getElementById("playbutton_ID").value = "Release";
					// Call soundmodel method
					i_sm.play();
				} else {
					myWindow.document.getElementById("playbutton_ID").value = "Play";
					// Call soundmodel method
					i_sm.release();
				}
				playingP = !playingP;
			});

			// Now set up the parameters
			utils.objForEach(params, setupParameter);
			// end for each parameter loop

			// Turn off sounds if window is closed
			function confirmExit() {
				i_sm.release();
			}

			myWindow.onbeforeunload = confirmExit;

			myWindow.focus();
			//console.log("moved focus");

			//-------------------------------------------------------------------------------------------------------------- 
			// Now overide the methods of the sound model interface to push the buttons and move the sliders on this GUI
			//   (rather than call play and stop and change paramters directly)
			//    We do this so that programatic changes will be reflected in the gui as well as (through the gui) change the sound.
			//    To the caller, this API looks just like a sound model - except that they have to use setParamNorm rather than sound model specific parameter setting functions.

			myInterface.play = function () {
				myWindow.document.getElementById("playbutton_ID").click();
			};

			myInterface.release = function () {
				myWindow.document.getElementById("playbutton_ID").click();
			};

			// override the baseSM interface method to set params by moving sliders on the slider box
			myInterface.setRangeParamNorm = function (i_name, i_val) {
				var paramName, paramList, paramObject;
				if (utils.isInteger(i_name)) {
					paramName = myInterface.getParamName(i_name);
				} else {
					paramName = i_name.replace(/\s+/g, '') + "_controllerID";
				}

				paramList = myInterface.getParams();

				if (!paramList[paramName]) {
					return;
				}

				paramObject = paramList[paramName];
				var controllerElement = myWindow.document.getElementById(paramName);
				controllerElement.value = (paramObject.value.min + i_val * (paramObject.value.max - paramObject.value.min));   // pfunc(pmin + i_Val * (pmax - pmin))
				controllerElement.change();
			};

			myInterface.setParamNorm = myInterface.setRangeParamNorm;

			return myInterface;
		};
	}
);