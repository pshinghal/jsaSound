/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

//PARA: config
//		-config.audioContext
function jsaGranularMp3Factory(config, baseSM) {

	//Useful addition:
	//When the file finishes playing, change release time to 0;
	//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
	//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

	//Currently, I've just enabled looping to overcome that problem

	var tempNum = 0;
	var i = 0;

	var buffLoaded = false, architectureBuilt = false;

	var xhr = new XMLHttpRequest();
	var soundBuff = null;

	var gainLevelNode;

	var m_gainLevel = 0.5;
	// var m_attackTime = 0.05;
	// var m_releaseTime = 1.0;
	var m_soundUrl = "";//"./sounds/schumannLotusFlower.mp3";
	var m_grainSize = 0.9;
	var m_speed = 1.0;
	var m_pitch = 0.0;

	var bufferDuration = 1.0; //This is a very irrelevant figure at this point
	var realTime = 0.0;
	var grainTime = 0.0;
	var grainDuration = m_grainSize;
	var grainSpacing = 0.25 * grainDuration;
	var speed = m_speed;
	var pitchRate = Math.pow(2.0, m_pitch);

	var grainWindow;
	var grainWindowLength = 16384;
	grainWindow = new Float32Array(grainWindowLength);
	for (i = 0; i < grainWindowLength; i += 1) {
		grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
	}

	var continuePlaying = true;

	var myInterface = baseSM();

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
			bufferDuration = soundBuff.duration;
			console.log("Buffer loaded with duration " + bufferDuration);

			//SHOULD THIS FUNCTION BE CALLED BEFORE CHANGING buffLoaded ???
			//buildModelArchitecture();
		};
		xhr.send();
	}

	function buildModelArchitecture() {
		gainLevelNode = config.audioContext.createGainNode();

		// Looping is to be thought of quite differently in Granular synthesis
		gainLevelNode.gain.value = m_gainLevel;

		gainLevelNode.connect(config.audioContext.destination);

		architectureBuilt = true;

		//console.log("architecture built");
	}

	function scheduleGrain() {
		//console.log("scheduleGrain triggered");
		var source = config.audioContext.createBufferSource();
		//console.log("source created");
		source.buffer = soundBuff;
		source.playbackRate.value = pitchRate;
		//console.log("soundBuff created");

		//TODO: See if the problem is being caused by the fact that we aren't creating NEW "gainLevelNode"s
		buildModelArchitecture();

		var grainWindowNode = config.audioContext.createGainNode();
		source.connect(grainWindowNode);
		grainWindowNode.connect(gainLevelNode);

		//console.log("before noteGrainOn");
		//console.log("scheduling noteGrainOn with " + realTime + " " + grainTime + " " + grainDuration);
		source.noteGrainOn(realTime, grainTime, grainDuration);
		//console.log("noteGrainOn triggered");
		grainWindowNode.gain.value = 0.0;
		grainWindowNode.gain.setValueCurveAtTime(grainWindow, realTime, grainDuration / pitchRate);

		realTime += grainSpacing;
		//console.log(realTime);
		grainTime += grainSpacing * speed;
		//console.log("updated stuff");
		if (grainTime > bufferDuration) {
			grainTime = 0.0;
		}
		if (grainTime < 0.0) {
			grainTime += bufferDuration; // Not Sure why
		}
	}

	function stopScheduler() {
		console.log("stopping");
		continuePlaying = false;
	}

	function schedule() {
		console.log("schedule triggered");
		if (!continuePlaying) {
			return;
		}

		var currentTime = config.audioContext.currentTime;

		//console.log("here");

		//console.log("grainTime: " + grainTime);
		//console.log("grainSpacing: " + grainSpacing);
		//console.log("realTime: " + realTime);
		while (realTime < currentTime + 0.100) {
			scheduleGrain();
			//realTime += 0.01;
		}
		//console.log(tempNum++);

		setTimeout(schedule, 20);
	}

	myInterface.play = function (i_gain) {
		if (buffLoaded) {
			realTime = config.audioContext.currentTime;
			console.log("got realTime");
			continuePlaying = true;
			console.log("before schedule");
			setTimeout(schedule, 1);

			gainLevelNode.gain.value = i_gain || m_gainLevel;
			console.log("Gain set at " + gainLevelNode.gain.value);
		} else {
			console.log("Buffer NOT loaded yet!");
			//CREATE EXTERNAL CALLBACK HERE!!!
			alert("Press load and wait!");
		}
	};

	myInterface.setGain = myInterface.registerParam(
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

	myInterface.setSpeed = myInterface.registerParam(
		"Speed",
		"range",
		{
			"min": 0,
			"max": 2,
			"val": m_speed
		},
		function (i_val) {
			speed = m_speed = i_val;
		}
	);

	myInterface.setGrainSize = myInterface.registerParam(
		"Grain Size",
		"range",
		{
			"min": 0.010,
			"max": 0.5,
			"val": m_grainSize
		},
		function (i_val) {
			m_grainSize = i_val;
			grainDuration = m_grainSize;
			grainSpacing = 0.25 * grainDuration;
		}
	);

	myInterface.setPitch = myInterface.registerParam(
		"Pitch",
		"range",
		{
			"min": -2.0,
			"max": 2.0,
			"val": m_pitch
		},
		function (i_val) {
			m_pitch = i_val;
			pitchRate = Math.pow(2.0, m_pitch);
		}
	);

//  myInterface.setAttackTime = myInterface.registerParam(
//      "Attack Time",
//      "range",
//      {
//          "min": 0,
//          "max": 1,
//          "val": m_attackTime
//      },
//      function(i_val) {
//          m_attackTime = parseFloat(i_val);
//      }
//  );

//  myInterface.setReleaseTime = myInterface.registerParam(
//      "Release Time",
//      "range",
//      {
//          "min": 0,
//          "max": 3,
//          "val": m_releaseTime
//      },
//      function(i_val) {
//          m_releaseTime = parseFloat(i_val);
//      }
//  );

	myInterface.setSoundUrl = myInterface.registerParam(
		"Sound URL",
		"url",
		{
			"val": "http://localhost/schumannLotusFlower.mp3"
		},
		function (i_val) {
			m_soundUrl = i_val;
			buffLoaded = false;
			sendXhr();
		}
	);

	myInterface.release = function () {
		console.log("release triggered");

		//TODO: Remove this timeOut thing if possible
		setTimeout(stopScheduler, 0);
		architectureBuilt = false; //probably
	};

	return myInterface;
}