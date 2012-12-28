/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

//PARA: config
//		-audioContext
//		bigNum
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM"],
	function (config, baseSM) {
		return function () {
			//Useful addition:
			//When the file finishes playing, change release time to 0;
			//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
			//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

			//CUrrently, I've just enabled looping to overcome that problem

			var buffLoaded = false, architectureBuilt = false;

			var xhr = new XMLHttpRequest();
			var soundBuff = null;

			var gainEnvNode, gainLevelNode, sourceNode;

			var m_gainLevel = 0.5;
			var m_attackTime = 0.05;
			var m_releaseTime = 1.0;
			var m_soundUrl = "";
			var stopTime = 0.0;
			var now = 0.0;

			var myInterface = baseSM();

			function buildModelArchitecture() {
				sourceNode = config.audioContext.createBufferSource();
				gainEnvNode = config.audioContext.createGainNode();
				gainLevelNode = config.audioContext.createGainNode();

				sourceNode.buffer = soundBuff;
				sourceNode.loop = true;
				gainLevelNode.gain.value = m_gainLevel;
				gainEnvNode.gain.value = 0;

				sourceNode.connect(gainEnvNode);
				gainEnvNode.connect(gainLevelNode);
				gainLevelNode.connect(config.audioContext.destination);

				architectureBuilt = true;
			}

			function sendXhr() {
				//SHOULD XHR BE RE-CONSTRUCTED??
				xhr.open('GET', m_soundUrl, true);
				xhr.responseType = 'arraybuffer';
				xhr.onerror = function (e) {
					console.error(e);
				};
				xhr.onload = function () {
					console.log("Sound(s) loaded");
					soundBuff = config.audioContext.createBuffer(xhr.response, false);
					buffLoaded = true;
					console.log("Buffer Loaded!");
					//SHOULD THIS FUNCTION BE CALLED BEFORE CHANGING buffLoaded ???
					buildModelArchitecture();
				};
				xhr.send();
			}

			myInterface.play = function (i_gain) {
				if (buffLoaded) {
					now = config.audioContext.currentTime;
					if (stopTime <= now) {
						console.log("rebuilding");
						buildModelArchitecture();
						sourceNode.noteOn(now);
						gainEnvNode.gain.value = 0;
					} else {
						console.log("NOT re-building");
						gainEnvNode.gain.cancelScheduledValues(now);
					}

					stopTime = config.bigNum;
					sourceNode.noteOff(stopTime);

					gainLevelNode.gain.value = i_gain || m_gainLevel;
					console.log("Gain set at " + gainLevelNode.gain.value);

					gainEnvNode.gain.setValueAtTime(0, now);
					gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime);
				} else {
					console.log("Buffer NOT loaded yet!");
					//CREATE EXTERNAL CALLBACK HERE!!!
					alert("Press load and wait!");
				}
			};

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
					m_attackTime = parseFloat(i_val);
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
					m_releaseTime = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Sound URL",
				"url",
				{
					"val": "http://46.137.211.192/schumannLotusFlower.mp3"
				},
				function (i_val) {
					m_soundUrl = i_val;
					buffLoaded = false;
					sendXhr();
				}
			);

			myInterface.release = function () {
				now = config.audioContext.currentTime;
				stopTime = now + m_releaseTime;

				gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
				sourceNode.noteOff(stopTime);
				architectureBuilt = false; //probably
			};

			return myInterface;
		};
	}
);