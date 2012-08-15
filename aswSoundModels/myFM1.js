/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
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
var aswFMFactory = function(){
	// defined outside "aswFMInterface" so that they can't be seen be the user of the sound models.
	// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
	var	oscModulatorNode = audioContext.createOscillator();
	var m_CarrierNode = fmodOscFactory();	
	var	gainEnvNode = audioContext.createGainNode();
	var	gainLevelNode = audioContext.createGainNode();
	
	// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
	var m_gainLevel=.5;    // the point to (or from) which gainEnvNode ramps glide
	var m_car_freq=440;    
	var m_mod_freq=30;    
	var m_modIndex=1.0		
	var m_attackTime=.05;  
	var m_releaseTime=1.0;	   
	var stopTime=0.0;        // will be > audioContext.currentTime if playing
	var now=0.0;
	
		
	// (Re)create the nodes and thier connections.
	// Must be called everytime we want to start playing since nodes are *deleted* following the occilator noteoff()!!!.
	var buildModelArchitecture = function(){
		// These must be called on every play because of the tragically short lifetime ... however, after the 
		// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
		oscModulatorNode = audioContext.createOscillator();
		m_CarrierNode = fmodOscFactory();
		gainEnvNode = audioContext.createGainNode();
		gainLevelNode = audioContext.createGainNode();
		
		// Also have to set all of their state values since they all get forgotten, too!!
		gainLevelNode.gain.value = m_gainLevel;
		gainEnvNode.gain.value = 0; 	
		oscModulatorNode.type = 0;  //sin
		
		oscModulatorNode.frequency.value = m_mod_freq;
		m_CarrierNode.setModIndex(m_modIndex); 
		
		// make the graph connections
		oscModulatorNode.connect( m_CarrierNode );
		m_CarrierNode.connect(gainEnvNode );
		
		
		gainEnvNode.connect( gainLevelNode );
		gainLevelNode.connect( audioContext.destination );
	}	

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
			oscModulatorNode.noteOn(now);
			gainEnvNode.gain.value = 0;
		} else {  // no need to recreate architectre - the old one still exists since it is playing
			foo = (stopTime <= now);
			//console.log("stopTime <= now)  === " + foo);
			//console.log(" ... NOT building architecure because stopTime (" + stopTime + " ) is greater than now ("+now+")");
			gainEnvNode.gain.cancelScheduledValues( now );
		}
		// The rest of the code is for new starts or restarts	
		stopTime = bigNum;
		oscModulatorNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think

		// if no input, remember from last time set
		m_CarrierNode.setFreq(i_freq ? i_freq : m_car_freq);
		gainLevelNode.gain.value = i_gain ? i_gain : m_gainLevel;
		
		// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
		foo = now + m_attackTime;
		//console.log( "   ramp to level " + gainLevelNode.gain.value + " at time " + foo);
		gainEnvNode.gain.setValueAtTime(0, now);
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
	};

	// ----------------------------------------
	myInterface.setCarFreq= myInterface.registerParam(
		"Carrier Frequency",
                "range",
                {
                        "min": 200,
                        "max": 1000,
                        "val": m_car_freq
                },
		function(i_val) {
			//console.log("in setCarFreq, m_car_freq = " + i_val);
			m_car_freq = i_val;
			m_CarrierNode.setFreq(m_car_freq); 
		}
	);
	// ----------------------------------------
	myInterface.setModIndex= myInterface.registerParam(
		"Modulation Index",
                "range",
                {
                        "min": 0,
                        "max": 100,
                        "val": m_modIndex
                },
		function(i_val) {
			m_modIndex = i_val;
			m_CarrierNode.setModIndex(m_modIndex); 
		}
	);
	// ----------------------------------------
	myInterface.setModFreq= myInterface.registerParam(
		"Modulator Frequency",
                "range",
                {
                        "min": 0,
                        "max": 200,
                        "val": m_mod_freq
                },
		function(i_val) {
			//console.log("in sm.setFreq, oscModulatorNode = " + oscModulatorNode);
			oscModulatorNode.frequency.value = m_mod_freq = i_val; 
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
		oscModulatorNode.noteOff(stopTime);
	};
		
	//console.log("paramlist = " + myInterface.getParamList().prettyString());					
	return myInterface;
}


