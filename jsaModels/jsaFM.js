/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/


define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaFModOsc"],
	function (config, baseSM, fmodOscFactory) {
		return function () {
			var	oscModulatorNode = config.audioContext.createOscillator();
			var m_CarrierNode = fmodOscFactory();
			var	gainEnvNode = config.audioContext.createGainNode();
			var	gainLevelNode = config.audioContext.createGainNode();

			// these are defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
			var m_car_freq = 440;
			var m_mod_freq = 30;
			var m_modIndex = 1.0;
			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now = 0.0;

			// (Re)create the nodes and thier connections.
			// Must be called everytime we want to start playing since nodes are *deleted* following the occilator noteoff()!!!.
			var buildModelArchitecture = function () {
				// These must be called on every play because of the tragically short lifetime ... however, after the 
				// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
				oscModulatorNode = config.audioContext.createOscillator();
				m_CarrierNode = fmodOscFactory();
				gainEnvNode = config.audioContext.createGainNode();
				gainLevelNode = config.audioContext.createGainNode();

				// Also have to set all of their state values since they all get forgotten, too!!
				gainLevelNode.gain.value = m_gainLevel;
				gainEnvNode.gain.value = 0;
				oscModulatorNode.type = 0;  //sin

				oscModulatorNode.frequency.value = m_mod_freq;
				m_CarrierNode.setModIndex(m_modIndex);

				// make the graph connections
				oscModulatorNode.connect(m_CarrierNode);
				m_CarrierNode.connect(gainEnvNode);


				gainEnvNode.connect(gainLevelNode);
				gainLevelNode.connect(config.audioContext.destination);
			};

			var myInterface = baseSM();

			myInterface.setAboutText("This is a simple frequency modulator with a-rate updates of the carrier frequency.")

			myInterface.play = function (i_freq, i_gain) {
				now = config.audioContext.currentTime;

				// It seems silly have to CREATE these nodes & connections every time play() is called. Why can't I do it once (outside of "myInterface")??
				// Don't need to do this if decay on previous decay is still alive...   
				if (stopTime <= now) { // not playing
					console.log("rebuild model node architecture!");
					buildModelArchitecture();
					oscModulatorNode.noteOn(now);
					gainEnvNode.gain.value = 0;
				} else {  // no need to recreate architectre - the old one still exists since it is playing

					//NOT building architecure because stopTime (" + stopTime + " ) is greater than now ("+now+")";
					gainEnvNode.gain.cancelScheduledValues(now);
				}
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;
				oscModulatorNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think

				// if no input, remember from last time set
				m_CarrierNode.setFreq(i_freq || m_car_freq);
				gainLevelNode.gain.value = i_gain || m_gainLevel;

				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
			};

			myInterface.registerParam(
				"Carrier Frequency",
				"range",
				{
					"min": 200,
					"max": 1000,
					"val": m_car_freq
				},
				function (i_val) {
					m_car_freq = i_val;
					m_CarrierNode.setFreq(m_car_freq);
				}
			);

			myInterface.registerParam(
				"Modulation Index",
				"range",
				{
					"min": 0,
					"max": 100,
					"val": m_modIndex
				},
				function (i_val) {
					m_modIndex = i_val;
					m_CarrierNode.setModIndex(m_modIndex);
				}
			);

			myInterface.registerParam(
				"Modulator Frequency",
				"range",
				{
					"min": 0,
					"max": 200,
					"val": m_mod_freq
				},
				function (i_val) {
					oscModulatorNode.frequency.value = m_mod_freq = i_val;
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

			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.linearRampToValueAtTime(gainEnvNode.gain.value, now);
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				oscModulatorNode.noteOff(stopTime);
			};
				
			return myInterface;
		};
	}
);