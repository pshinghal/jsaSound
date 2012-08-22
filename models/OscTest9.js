/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/* #INCLUDE
components/jsaAudioComponents.js
    for baseSM and fmodOscFactory
	
utils/utils.js
	for Array.prototype.prettyString 
*/

/* The Audio Stuff

 refs:
	http://stuartmemo.com/making-sine-square-sawtooth-and-triangle-waves/
	JSyn's Phil Burke:
		http://www.softsynth.com/webaudio/gainramp.php
	Google's evangelist Chis Wilson's examples:
		http://webaudio-io2012.appspot.com/js/examples.js
			function playOsc(type) 

 --------------------------------------------------------------
  The idea here, besides learning and experimenting with Web Audio capabilities, is to 
  come up with an architecture that looks like a "sound model" - exposing an interface
  and hiding stuff a model user shouldn't see or change. All using the particular "good parts"
  of javascript.
  
 --------------------------------------------------------------
// Notes: 
	Uses new audioContext.createOscillator();

// Weirdness
	- "smoothing" that creates frequency glide - built in default behavior, not coded by me.
	- The two oscilators don't start at the same time (if the previous decay has finished and sound Node architecture must be rebuilt)
	- Attack is not ramped - jumps from starting value to target value at target time. 
	- Decay is ramped, but starting value doesn't seem to be the "current" value" - there is a little bump when the ramp starts. 
*/

// ******************************************************************************************************
// A "sound model" (which is essentially just an oscillator).
// There is an attack time, a hold until release() is called, and a decay time.
// The attack and decay have weirdnesses - I *think* I am doing it correctly, so I blame webaudio beta and Canary....
// The attack and decaya
// ******************************************************************************************************
var oscFactory = function(){
	// defined outside "oscInterface" so that they can't be seen be the user of the sound models.
	// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
	var	oscNode = audioContext.createOscillator();
	var	gainEnvNode = audioContext.createGainNode();
	var	gainLevelNode = audioContext.createGainNode();
	
	// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
	var m_gainLevel=.5;    // the point to (or from) which gainEnvNode ramps glide
	var m_frequency=440;   // 
	var m_attackTime=.05;  //
	var m_releaseTime=1.0;	   //
	var stopTime=0.0;        // will be > audioContext.currentTime if playing
	var now=0.0;
	
	// (Re)create the nodes and thier connections.
	// Must be called everytime we want to start playing since nodes are *deleted* when they aren't being used.
	var buildModelArchitecture = function(){
		// These must be called on every play because of the tragically short lifetime ... however, after the 
		// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
		oscNode = audioContext.createOscillator();
		gainEnvNode = audioContext.createGainNode();
		gainLevelNode = audioContext.createGainNode();
		
		gainLevelNode.gain.value = m_gainLevel;
		gainEnvNode.gain.value = 0; 	
		oscNode.type = 1;  //square
		
		// make the graph connections
		oscNode.connect( gainEnvNode );
		gainEnvNode.connect( gainLevelNode );
		gainLevelNode.connect( audioContext.destination );
	};

	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_freq, i_gain){	
		now = audioContext.currentTime;
		//console.log("PLAY! time = " + now);
		// It seems silly have to CREATE these nodes & connections every time play() is called. Why can't I do it once (outside of "myInterface")??
		// Don't need to do this if decay on previous decay is still alive...   
		if (stopTime <= now){ // not playing
			console.log("rebuild model node architecture!");
			buildModelArchitecture();
			oscNode.noteOn(now);
			gainEnvNode.gain.value = 0;
		} else {  // no need to recreate architectre - the old one still exists since it is playing
			foo = (stopTime <= now);
			//console.log("stopTime <= now)  === " + foo);
			console.log(" ... NOT building architecure because stopTime (" + stopTime + " ) is greater than now ("+now+")");
			gainEnvNode.gain.cancelScheduledValues( now );
		}
		// The rest of the code is for new starts or restarts	
		stopTime = bigNum;
		oscNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think

		// if no input, remember from last time set
		oscNode.frequency.value = i_freq ? i_freq : m_frequency;										
		gainLevelNode.gain.value = i_gain ? i_gain : m_gainLevel;
		
		// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
		foo = now + m_attackTime;
		//console.log( "   ramp to level " + gainLevelNode.gain.value + " at time " + foo);
		gainEnvNode.gain.setValueAtTime(0, now);
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
	};

	// ----------------------------------------
	myInterface.setFreq= myInterface.registerParam(
		"Frequency",
                "range",
                {
                        "min": 200,
                        "max": 1000,
                        "val": m_frequency
                },
		function(i_freq) {
			//console.log("in sm.setFreq, oscNode = " + oscNode);
			oscNode.frequency.value = m_frequency = i_freq; 
		}
	);
			
	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam(
		"Gain",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_gainLevel
                },
		function(i_val) {
			//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
			gainLevelNode.gain.value = m_gainLevel = i_val;
		}
	);

	// ----------------------------------------		
	myInterface.setAttackTime = myInterface.registerParam(
		"Attack Time",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_attackTime
                },
		function(i_val) {
			m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
		}
	);

	// ----------------------------------------		
	myInterface.setReleaseTime = myInterface.registerParam(
		"Release Time",
                "range",
                {
                        "min": 0,
                        "max": 3,
                        "val": m_releaseTime
                },
		function(i_val) {
			m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
		}
	);

	// ----------------------------------------
	myInterface.release = function(){
		now = audioContext.currentTime;
		stopTime = now + m_releaseTime;
		//console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
		//console.log("------------");

		// linear ramp decay seems fine!  
		gainEnvNode.gain.linearRampToValueAtTime(0, stopTime); 
		oscNode.noteOff(stopTime);
	};
	
	//console.log("paramlist = " + myInterface.getParamList().prettyString());			
	return myInterface;
}



