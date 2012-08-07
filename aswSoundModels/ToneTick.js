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
*/

// ******************************************************************************************************
// A "sound model" (which is essentially just an oscillator).
// There is an attack time, a hold until release() is called, and a decay time.
// The attack and decay have weirdnesses - I *think* I am doing it correctly, so I blame webaudio beta and Canary....
// The attack and decaya
// ******************************************************************************************************
var aswToneTickFactory = function(){
	// defined outside "oscInterface" so that they can't be seen be the user of the sound models.
	// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
	var	oscNode = audioContext.createOscillator();
	var	gainEnvNode = audioContext.createGainNode();
	var	gainLevelNode = audioContext.createGainNode();
	
	// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
	var m_gainLevel = 0.5;    // the point to (or from) which gainEnvNode ramps glide
	var m_frequency = 440;   // 
	var m_attackTime = 0.02;  //
	var m_sustainTime = 0.1;
	var m_releaseTime = 0.2;	   //
	var stopTime = 0.0;        // will be > audioContext.currentTime if playing
	var now = 0.0;
	

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
			oscNode.noteOn(now);
			gainEnvNode.gain.value = 0;
		} else {  // no need to recreate architectre - the old one still exists since it is playing
			foo = (stopTime <= now);
			//console.log("stopTime <= now)  === " + foo);
			console.log(" ... NOT building architecure because stopTime (" + stopTime + " ) is greater than now ("+now+")");
		}
		gainEnvNode.gain.cancelScheduledValues( now );
		// The model turns itself off after a fixed amount of time	
		stopTime = now + m_attackTime+m_sustainTime+m_releaseTime;
		oscNode.noteOff(stopTime);  // "cancels" any previously set future stops, I think

		// if no input, remember from last time set
		oscNode.frequency.value = i_freq ? i_freq : m_frequency;										
		gainLevelNode.gain.value = i_gain ? i_gain : m_gainLevel;
		
		// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
		gainEnvNode.gain.setValueAtTime(0, now);
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime+ m_sustainTime);
		gainEnvNode.gain.linearRampToValueAtTime(0, stopTime);
		};

	// ----------------------------------------
	myInterface.setFreq= myInterface.registerParam("Frequency", 200, 1000, m_frequency, 
		function(i_freq){
			//console.log("in sm.setFreq, oscNode = " + oscNode);
			oscNode.frequency.value = m_frequency = i_freq; 
		});
			
	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam("Gain", 0, 1, m_gainLevel, 
		function(i_val){
		//console.log("in sm.setGain, gainLevelNode = " + gainLevelNode);
		gainLevelNode.gain.value = m_gainLevel = i_val;
	});

	// ----------------------------------------		
	myInterface.setAttackTime = myInterface.registerParam("Attack Time", 0, 1, m_attackTime, 
		function(i_val){
		m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
	});

		// ----------------------------------------		
	myInterface.setSustainTime = myInterface.registerParam("Sustain Time", 0, 3, m_sustainTime, 
		function(i_val){
		m_sustainTime = parseFloat(i_val); // javascript makes me cry ....
	});

	// ----------------------------------------		
	myInterface.setReleaseTime = myInterface.registerParam("Release Time", 0, 3, m_releaseTime, 
		function(i_val){
		m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
	});

	
	//console.log("paramlist = " + myInterface.getParamList().prettyString());			
	return myInterface;
}



