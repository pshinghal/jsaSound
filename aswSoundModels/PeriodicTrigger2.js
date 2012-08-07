/*
Author: Lonce Wyse
Date: July 2012
*/
/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
    for baseSM 
	
aswSoundModels/aswSimpleNoiseTick2.js
     for aswSimpleNoiseTickFactory2
	 
*/
/* This model explores using JavaScriptAudioNode.onaudioprocess() as a callback for generating events for other Audio Node. 
	A phasor is used to trigger events for another SoundModel each time it "ticks" (wraps around).
	
*/

var aswPeriodicTriggerFactory2 = function (){
	var m_futureinterval = .05;  // the amount of time to compute events ahead of now

	var m_rate=5;  // in events per second
	var m_gain = 0.40;
	
	var child = aswSimpleNoiseTickFactory2();
	
	var m_ephasor = aswEventPhasor();
	m_ephasor.setFreq(m_rate);

	var eventGenerator = audioContext.createJavaScriptNode(k_bufferLength, 1, 1);
	
	//  Event generator (using JavaScriptAudioNode.onaudioprocess() as a callback) ------------
	eventGenerator.onaudioprocess = function (e) {		
		var now = audioContext.currentTime;	// this is the time this callback comes in - there could be jitter, etc.	
		var next_uptotime = now+m_futureinterval;		
		var nextTickTime=m_ephasor.nextTickTime(); // A "tick" is when the phasor wraps around		

		console.log("cb now = " + now+ ", next TickTime is " + nextTickTime + ", uptoTime is " + next_uptotime);		
		
		var ptime;  // the event play time
		
		while (next_uptotime > nextTickTime){
			ptime = nextTickTime;
				
			// Generate the "event"
			//child.play();			// NEED A PLAY-TIME ARGUMENT 	HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!	
			child.qplay(ptime);

			m_ephasor.advanceToTick();
			nextTickTime=m_ephasor.nextTickTime();		// so when is the next tick?
		}		
		m_ephasor.advanceToTime(next_uptotime); // advance phasor to the current computed upto time.
	}	
	
	//-------------------------------------------------------------------------------------------------
	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_freq, i_gain){	
		var now = audioContext.currentTime;
		m_ephasor.setPhase(.999999999);	// so that the phaser wraps to generate an event immediately after starting
		m_ephasor.setCurrentTime(now);
		eventGenerator.connect(audioContext.destination);  // This is the call to "setup callbacks" for the event generator
	}		
	
	// ----------------------------------------
	myInterface.release = function(){
		child.release();
		eventGenerator.disconnect(); // stop the event generator by disconnecting from audioContext.destination (yuck)
		console.log("------------");
	};

	// ----------------------------------------		
	myInterface.setRate = myInterface.registerParam("Rate", 1, 100, m_rate, 
		function(i_val){
		m_rate = parseFloat(i_val);
		m_ephasor.setFreq(m_rate);
	});

	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam("Gain", 0, 1, m_gain, 
		function(i_val){
		m_gain = parseFloat(i_val);
		child.setGain(m_gain);
	});
	
	return myInterface;
}