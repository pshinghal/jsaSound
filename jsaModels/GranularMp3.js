/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
function granularMp3Factory() {
	
	//Useful addition:
	//When the file finishes playing, change release time to 0;
	//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
	//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

	//CUrrently, I've just enabled looping to overcome that problem

	var tempNum = 0;

	var buffLoaded = false, architectureBuilt = false;

	var xhr = new XMLHttpRequest();
	var soundBuff = null;

	var gainEnvNode, gainLevelNode, sourceNode;

	var m_gainLevel = 0.5;
	var m_attackTime = 0.05;
	var m_releaseTime = 1.0;
	var m_soundUrl = "";//"./sounds/schumannLotusFlower.mp3";
	var m_grainSize = 0.09;
	var m_speed = 1.0;
	var stopTime = 0.0;
	var now = 0.0;

	var bufferDuration = 1.0; //This is a very irrelevant figure at this point
	var realTime = 0.0;
	var grainTime = 0.0;
	var grainDuration = 0.0;
	var grainSpacing = 0.0;
	var speed = m_speed;

	var continuePlaying = true;
	
	var myInterface = baseSM();

	function sendXhr() {
		//SHOULD XHR BE RE-CONSTRUCTED??
		xhr.open('GET', m_soundUrl, true);
		xhr.responseType = 'arraybuffer';
		xhr.onerror = function(e) {
			console.error(e);
		};
		xhr.onload = function() {
			console.log("Sound(s) loaded");
			soundBuff = audioContext.createBuffer(xhr.response, false);
			buffLoaded = true;
			bufferDuration = soundBuff.duration;
			console.log("Buffer loaded with duration " + bufferDuration);
			
			//SHOULD THIS FUNCTION BE CALLED BEFORE CHANGING buffLoaded ???
			buildModelArchitecture();
		};
		xhr.send();
	}

	function buildModelArchitecture() {
		//sourceNode = audioContext.createBufferSource();
		gainEnvNode = audioContext.createGainNode();
		gainLevelNode = audioContext.createGainNode();

		//sourceNode.buffer = soundBuff;
		//sourceNode.loop = true;
		// Looping is to be thought of quite differently in Granular synthesis
		gainLevelNode.gain.value = m_gainLevel;
		gainEnvNode.gain.value = 0;

		//sourceNode.connect(gainEnvNode);
		gainEnvNode.connect(gainLevelNode);
		gainLevelNode.connect(audioContext.destination);

		architectureBuilt = true;

		console.log("architecture built");
	}

	function scheduleGrain() {
		//console.log("scheduleGrain triggered");
		var source = audioContext.createBufferSource();
		//console.log("source created");
		source.buffer = soundBuff;
		//console.log("soundBuff created");
		source.connect(gainEnvNode);
		//console.log("before noteGrainOn");
		source.noteGrainOn(realTime, grainTime, grainDuration);
		//console.log("noteGrainOn triggered");

		realTime += grainSpacing;
		grainTime += grainSpacing * speed;

		if (grainTime > bufferDuration) grainTime = 0.0;
		if (grainTime < 0.0) grainTime += bufferDuration; // Not Sure why
	}

	function stopScheduler() {
		continuePlaying = false;
	}

	function schedule() {
		//console.log("schedule triggered");
		if(!continuePlaying)
			return;

		var currentTime = audioContext.currentTime;

		while (realTime < currentTime + 0.100) {
			scheduleGrain();
		}

		console.log(tempNum++);

		setTimeout(schedule, 20);
	}

	myInterface.play = function(i_gain) {
		if (buffLoaded) {
			now = audioContext.currentTime;
			// TODO: See is we can remove this whole stopTime condition
			if (stopTime <= now) {
				console.log("rebuilding");
				buildModelArchitecture();
				//sourceNode.noteOn(now);
				console.log("after architecture build");
				realTime = audioContext.currentTime;
				console.log("got realTime");
				continuePlaying = true;
				console.log("before schedule");
				schedule();
				gainEnvNode.gain.value = 0;
			} else {
				console.log("NOT re-building");
				gainEnvNode.gain.cancelScheduledValues(now);
			}
	
			stopTime = bigNum;
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

	myInterface.setGain = myInterface.registerParam(
		"Gain",
		"range",
		{
			"min": 0,
			"max": 1,
			"val": m_gainLevel
		},
		function(i_val) {
			gainLevelNode.gain.value = m_gainLevel = i_val;
		}
	);

	myInterface.setSpeed = myInterface.registerParam(
		"Speed",
		"range",
		{
			"min": 0,
			"max": 1,
			"val": m_speed
		},
		function(i_val) {
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
		function(i_val) {
			m_grainSize = i_val;
			grainDuration = m_grainSize;
			grainSpacing = 0.25 * grainDuration;
		}
	);

	myInterface.setAttackTime = myInterface.registerParam(
		"Attack Time",
		"range",
		{
			"min": 0,
			"max": 1,
			"val": m_attackTime
		},
		function(i_val) {
			m_attackTime = parseFloat(i_val);
		}
	);

	myInterface.setReleaseTime = myInterface.registerParam(
		"Release Time",
		"range",
		{
			"min": 0,
			"max": 3,
			"val": m_releaseTime
		},
		function(i_val) {
			m_releaseTime = parseFloat(i_val);
		}
	);

	myInterface.setSoundUrl = myInterface.registerParam(
		"Sound URL",
		"url",
		{
			"val": "http://localhost/schumannLotusFlower.mp3"
		},
		function(i_val) {
			m_soundUrl = i_val;
			buffLoaded = false;
			sendXhr();
		}
	);

	myInterface.release = function() {
		console.log("release triggered");
		now = audioContext.currentTime;
		stopTime = now + m_releaseTime;

		gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
		//sourceNode.noteOff(stopTime);
		setTimeout(stopScheduler, m_releaseTime);
		architectureBuilt = false; //probably
	};

	return myInterface;
}