/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/* #NOTE
Some of the sound models use microphone input. These models only work when run on a proper web web server (thought
one on the localhost will work fine). Also, when the user opens one of these models, the ALLOW/DISALLOW buttons
show up on the main browser window, not the sound model slider box window so it is easy to miss. If the user
doesn't push the ALLOW button, the model will not work properly. 
*/

/* --------------------------------------------------------------
	Just filtered noise band.
	The index of modulation allows for "faking" narrow-band noise from pure tone to noise. 

	Architecture:
		Gaussian mic input -> bandpass filter -> gainenv -> gain
******************************************************************************************************
*/

//PARA: config
//		-audioContext
//		-bigNum
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaNoiseNode"],
	function (config, baseSM, noiseNodeFactory) {
		return function () {
			// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
			// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
			var	m_noiseNode = noiseNodeFactory(),
				m_filterNode = config.audioContext.createBiquadFilter(),
				gainEnvNode = config.audioContext.createGainNode(),
				gainLevelNode = config.audioContext.createGainNode();

			var microphone;

			// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
			var m_gainLevel = 0.75, // the point to (or from) which gainEnvNode ramps glide
				m_freq = 750,
				m_Q = 2,
				m_attackTime = 0.05,
				m_releaseTime = 1.0,
				stopTime = 0.0,	// will be > audioContext.currentTime if playing
				now = 0.0;

			// (Re)create the nodes and thier connections.
			var buildModelArchitecture = (function () {

				// Called after the ALLOW button is pressed to permit mic input
				function gotAudio(stream) {
					console.log("in gotAudio, audioContext is " + config.audioContext);
					microphone = config.audioContext.createMediaStreamSource(stream);
					console.log("in gotAudio,  microphone is "  + microphone);
					//convertToMono( microphone ).connect(m_filterNode);
					microphone.connect(m_filterNode);
				}

				function error() {
    				alert('Stream generation failed.');
				}

				//var mediaGetter = navigator.getUserMedia || navigator.webkitGetUserMedia;
				m_noiseNode = noiseNodeFactory();

				m_filterNode = config.audioContext.createBiquadFilter();
				m_filterNode.type = m_filterNode.BANDPASS;
				m_filterNode.frequency.value = m_freq;
				m_filterNode.Q.value = m_Q;

				gainEnvNode = config.audioContext.createGainNode();
				gainEnvNode.gain.value = 0;

				gainLevelNode = config.audioContext.createGainNode();
				gainLevelNode.gain.value = m_gainLevel;

				try{
					//mediaGetter({audio:true}, gotAudio, error);
					navigator.webkitGetUserMedia({audio:true}, gotAudio, error);
				} catch(e){
					alert('webkitGetUserMedia threw exception :' + e);
				}


				//======================================
				// make the graph connections
				//m_noiseNode.connect(m_filterNode); // connect mic instead ...
				m_filterNode.connect(gainEnvNode);

				gainEnvNode.connect(gainLevelNode);
				gainLevelNode.connect(config.audioContext.destination);
			}());

			var myInterface = baseSM();
			myInterface.setAboutText("NOTE: Runs in Canary only, and only on a proper web server. Also, you must click the ALLOW button on Main Browser Window before playing. <br>")


			myInterface.play = function (i_freq, i_gain) {
				now = config.audioContext.currentTime;
				gainEnvNode.gain.cancelScheduledValues(now);
				// The rest of the code is for new starts or restarts	
				stopTime = config.bigNum;

				// if no input, remember from last time set
				m_freq = i_freq || m_freq;
				myInterface.set("Center Frequency", m_freq);
				gainLevelNode.gain.value = i_gain || m_gainLevel;

				// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
				//foo = now + m_attackTime;
				//console.log( " ramp to level " + gainLevelNode.gain.value + " at time " + foo);
				gainEnvNode.gain.setValueAtTime(0, now);
				gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
			};

			myInterface.registerParam(
				"Center Frequency",
				"range",
				{
					"min": 100,
					"max": 2000,
					"val": m_freq
				},
				function (i_val) {
					m_freq = i_val;
					m_filterNode.frequency.value = m_freq;
				}
			);

			myInterface.registerParam(
				"filter Q",
				"range",
				{
					"min": 0,
					"max": 150,
					"val": m_Q
				},
				function (i_val) {
					m_Q = i_val;
					m_filterNode.Q.value = m_Q;
				}
			);

			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 2,
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
					m_attackTime = parseFloat(i_val); // javascript makes me cry ....
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

				// shouldn't need this line, but for long sustain times, the system seems to "forget" what its current value is....
				//if (stopTime > now) { // only do this if we are currently playing
				//	gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now);
				//}
				// set new stoptime
				stopTime = now + m_releaseTime;
				gainEnvNode.gain.cancelScheduledValues(now);
				gainEnvNode.gain.linearRampToValueAtTime(gainEnvNode.gain.value, now);
				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
			};
			//--------------------------------------------------------------------------------
			// Other methods for the interface
			//----------------------------------------------------------------------------------
			myInterface.getFreq = function () {
				return m_freq;
			};
			//console.log("paramlist = " + myInterface.getParamList().prettyString());					
			return myInterface;
		};
	}
);