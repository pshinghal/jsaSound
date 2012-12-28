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
/* #INCLUDE
jsaComponents/jsaAudioComponents.js
	for baseSM 
	
jsaModels/jsaSimpleNoiseTick2.js
	 for jsaSimpleNoiseTickFactory2
	 
*/
/* This model explores using JavaScriptAudioNode.onaudioprocess() as a callback for generating events for other Audio Node. 
	A phasor is used to trigger events for another SoundModel each time it "ticks" (wraps around).
	
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaModels/jsaSimpleNoiseTick2", "jsaSound/jsaOpCodes/jsaEventPhasor"],
	function (config, baseSM, jsaSimpleNoiseTick2Factory, jsaEventPhasor) {
		return function () {
			var m_futureinterval = 0.05;  // the amount of time to compute events ahead of now

			var m_rate = 5;  // in events per second
			var m_gain = 0.40;

			var child = jsaSimpleNoiseTick2Factory();

			var m_ephasor = jsaEventPhasor();
			m_ephasor.setFreq(m_rate);

			var eventGenerator = config.audioContext.createJavaScriptNode(config.k_bufferLength, 1, 1);

			//  Event generator (using JavaScriptAudioNode.onaudioprocess() as a callback) ------------
			eventGenerator.onaudioprocess = function (e) {
				var now = config.audioContext.currentTime;	// this is the time this callback comes in - there could be jitter, etc.	
				var next_uptotime = now + m_futureinterval;
				var nextTickTime = m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around		

				console.log("cb now = " + now + ", next TickTime is " + nextTickTime + ", uptoTime is " + next_uptotime);

				var ptime;  // the event play time

				while (next_uptotime > nextTickTime) {
					ptime = nextTickTime;

					// Generate the "event"
					//child.play();
					// NEED A PLAY-TIME ARGUMENT HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
					child.qplay(ptime);

					m_ephasor.advanceToTick();
					nextTickTime = m_ephasor.nextTickTime();		// so when is the next tick?
				}
				m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
			};

			var myInterface = baseSM();
			myInterface.play = function (i_freq, i_gain) {
				var now = config.audioContext.currentTime;
				m_ephasor.setPhase(0.999999999);	// so that the phaser wraps to generate an event immediately after starting
				m_ephasor.setCurrentTime(now);
				eventGenerator.connect(config.audioContext.destination);  // This is the call to "setup callbacks" for the event generator
			};

			myInterface.release = function () {
				child.release();
				eventGenerator.disconnect(); // stop the event generator by disconnecting from audioContext.destination (yuck)
				// console.log("------------[released]");
			};

			myInterface.registerParam(
				"Rate",
				"range",
				{
					"min": 0,
					"max": 100,
					"val": m_rate
				},
				function (i_val) {
					m_rate = parseFloat(i_val);
					m_ephasor.setFreq(m_rate);
				}
			);

			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_gain
				},
				function (i_val) {
					m_gain = parseFloat(i_val);
					child.set("Gain", m_gain);
				}
			);

			return myInterface;
		};
	}
);