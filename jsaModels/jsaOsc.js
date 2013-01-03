/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

// ******************************************************************************************************
// A "sound model" (which is essentially just an oscillator).
// There is an attack time, a hold until release() is called, and a decay time.
// ******************************************************************************************************
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM"],
	function (config, baseSM) {
		return function () {
			
			// defined outside "oscInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	oscNode = config.audioContext.createOscillator();
			var	gainEnvNode = config.audioContext.createGainNode();
			var	gainLevelNode = config.audioContext.createGainNode();

			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
			var m_frequency = 440;
			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > config.audioContext.currentTime if playing
			var now = 0.0;

			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since nodes are *deleted* when they aren't being used.
			var buildModelArchitecture = function () {
				// These must be called on every play because of the tragically short lifetime ... however, after the 
				// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
				oscNode = config.audioContext.createOscillator();
				gainEnvNode = config.audioContext.createGainNode();
				gainLevelNode = config.audioContext.createGainNode();

				gainLevelNode.gain.value = m_gainLevel;
				gainEnvNode.gain.value = 0;
				oscNode.type = 1;  //square

				// make the graph connections
				oscNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
				gainLevelNode.connect(config.audioContext.destination);
			};

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM();
			// ----------------------------------------
			myInterface.play = function (i_freq, i_gain) {
				now = config.audioContext.currentTime;
				//console.log("PLAY! time = " + now);
				// It seems silly have to CREATE these nodes & connections every time play() is called. Why can't I do it once (outside of "myInterface")??
				// Don't need to do this if decay on previous decay is still alive...   
				if (stopTime <= now) { // not playing
					console.log("rebuild model node architecture!");
					buildModelArchitecture();
					oscNode.noteOn(now);
					gainEnvNode.gain.value = 0;
				} else {  	// Already playing
							// no need to recreate architectre - the old one still exists since it is playing
					console.log(" ... NOT building architecure because stopTime (" + stopTime + " ) is greater than now (" + now + ")");
					// Cancel any envelope events to start fresh
					gainEnvNode.gain.cancelScheduledValues(now);
				}
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;
				oscNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think

				// if no input, remember from last time set
				oscNode.frequency.value = i_freq || m_frequency;


				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(1, now + m_attackTime); // go to gain level over .1 secs			
			};

			myInterface.registerParam(
				"Frequency",
				"range",
				{
					"min": 200,
					"max": 1000,
					"val": m_frequency
				},
				function (i_freq) {
					//console.log("in sm.setFreq, oscNode = " + oscNode);
					oscNode.frequency.value = m_frequency = i_freq;
				}
			);

 
			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_gainLevel
				},
				function (i_val) {
					//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
					gainLevelNode.gain.value = m_gainLevel = i_val;
				}
			);


			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attackTime
				},
				function (i_val) {
					m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_releaseTime
				},
				function (i_val) {
					m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			// ----------------------------------------
			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.linearRampToValueAtTime(gainEnvNode.gain.value, now);
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				oscNode.noteOff(stopTime);
			};

			return myInterface;
		};
	}
);