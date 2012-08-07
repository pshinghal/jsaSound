/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
    for baseSM and fmodOscFactory
	
utils/utils.js
	for Array.prototype.prettyString 
*/

/* --------------------------------------------------------------
	FM with a noise source modulator.
	The index of modulation allows for "faking" narrow-band noise from pure tone to noise. 

	Architecture:
		Gaussian noise Node modulates the frequency of the modulator
******************************************************************************************************
*/

var aswNoisyFMFactory = function(){
	// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
	// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
	var	noiseModulatorNode = noiseNodeFactory();
	var m_CarrierNode = fmodOscFactory();	
	var	gainEnvNode = audioContext.createGainNode();
	var	gainLevelNode = audioContext.createGainNode();
	
	// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
	var m_gainLevel=.5;    // the point to (or from) which gainEnvNode ramps glide
	var m_car_freq=440;        
	var m_modIndex=1.0		
	var m_attackTime=.05;  
	var m_releaseTime=1.0;	   
	var stopTime=0.0;        // will be > audioContext.currentTime if playing
	var now=0.0;
	
		
	// (Re)create the nodes and thier connections.
	// Must be called everytime we want to start playing since nodes are *deleted* when they aren't being used.
	var buildModelArchitecture = function(){
		// These must be called on every play because of the tragically short lifetime ... however, after the 
		// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
		noiseModulatorNode = noiseNodeFactory();
		m_CarrierNode = fmodOscFactory();
		gainEnvNode = audioContext.createGainNode();
		gainLevelNode = audioContext.createGainNode();
		
		// Also have to set all of their state values since they all get forgotten, too!!
		gainLevelNode.gain.value = m_gainLevel;
		gainEnvNode.gain.value = 0; 	
		
		m_CarrierNode.setModIndex(m_modIndex); 
		
		// make the graph connections
		noiseModulatorNode.connect( m_CarrierNode );
		m_CarrierNode.connect(gainEnvNode );
		
		
		gainEnvNode.connect( gainLevelNode );
		gainLevelNode.connect( audioContext.destination );
	}();	

	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_freq, i_gain){	
		now = audioContext.currentTime;
		gainEnvNode.gain.cancelScheduledValues( now );

		stopTime = bigNum;

		// if no input, remember from last time set
		m_car_freq = i_freq ? i_freq : m_car_freq;
		m_CarrierNode.setFreq(m_car_freq);
		gainLevelNode.gain.value = i_gain ? i_gain : m_gainLevel;
		
		// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
		foo = now + m_attackTime;
		//console.log( "   ramp to level " + gainLevelNode.gain.value + " at time " + foo);
		gainEnvNode.gain.setValueAtTime(0, now);
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
	};

	// ----------------------------------------
	myInterface.setCarFreq= myInterface.registerParam("Carrier Frequency", 200, 2000, m_car_freq, 
		function(i_val){
			m_car_freq = i_val;
			m_CarrierNode.setFreq(m_car_freq); 
		});
	// ----------------------------------------
	myInterface.setModIndex= myInterface.registerParam("Modulation Index", 0, 1000, m_modIndex, 
		function(i_val){
			m_modIndex = i_val;
			m_CarrierNode.setModIndex(m_modIndex); 
		});
		
	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam("Gain", 0, 1, m_gainLevel, 
		function(i_val){
		gainLevelNode.gain.value = m_gainLevel = i_val;
	});

	// ----------------------------------------		
	myInterface.setAttackTime = myInterface.registerParam("Attack Time", 0, 1, m_attackTime, 
		function(i_val){
		m_attackTime = parseFloat(i_val);  // javascript makes me cry ....
	});

	// ----------------------------------------		
	myInterface.setReleaseTime = myInterface.registerParam("Release Time", 0, 3, m_releaseTime, 
		function(i_val){
		m_releaseTime = parseFloat(i_val); // javascript makes me cry ....
	});

	// ----------------------------------------
	myInterface.release = function(){
		now = audioContext.currentTime;
		stopTime = now + m_releaseTime;

		gainEnvNode.gain.linearRampToValueAtTime(0, stopTime); 
	};
		
	//console.log("paramlist = " + myInterface.getParamList().prettyString());					
	return myInterface;
}


