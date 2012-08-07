/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
    for baseSM and noiseNodeFactory()
	
utils/utils.js
	for Array.prototype.prettyString 
	
*/

/* --------------------------------------------------------------
	Just filtered noise band.
	The index of modulation allows for "faking" narrow-band noise from pure tone to noise. 

	Architecture:
		Gaussian noise Node -> bandpass filter -> gainenv -> gain
******************************************************************************************************
*/

var aswfilteredNoiseBandFactory = function () {
	// defined outside "aswNoisyFMInterface" so that they can't be seen be the user of the sound models.
	// They are created here (before they are used) so that methods that set their parameters can be called without referencing undefined objects
	var	m_noiseNode = noiseNodeFactory(),
		m_filterNode = audioContext.createBiquadFilter(),	
		gainEnvNode = audioContext.createGainNode(),
		gainLevelNode = audioContext.createGainNode();
	
	// these are both defaults for setting up initial values (and displays) but also a way of remembring across the tragic short lifetime of Nodes.
	var m_gainLevel = 0.5,    // the point to (or from) which gainEnvNode ramps glide
		m_freq = 440,        
		m_Q = 150.0,	
		m_attackTime = .05,  
		m_releaseTime = 1.0,	   
		stopTime = 0.0,        // will be > audioContext.currentTime if playing
		now = 0.0;
			
	// (Re)create the nodes and thier connections.
	var buildModelArchitecture = function () {
		// These must be called on every play because of the tragically short lifetime ... however, after the 
		// they have actally been completely deleted - a reference to gainLevelNode, for example, still returns [object AudioGainNode] 
		// Also have to set all of their state values since they all get forgotten, too!!
				
		m_noiseNode = noiseNodeFactory();
		
		m_filterNode = audioContext.createBiquadFilter();
		m_filterNode.type = m_filterNode.BANDPASS;
		m_filterNode.frequency.value = m_freq;
		m_filterNode.Q.value = m_Q; 
  
		gainEnvNode = audioContext.createGainNode();
		gainEnvNode.gain.value = 0; 
		
		gainLevelNode = audioContext.createGainNode();		
		gainLevelNode.gain.value = m_gainLevel;	
				
		// make the graph connections
		m_noiseNode.connect(m_filterNode);
		m_filterNode.connect(gainEnvNode);
				
		gainEnvNode.connect(gainLevelNode);
		gainLevelNode.connect(audioContext.destination);
	}();

		
	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_freq, i_gain){	
		now = audioContext.currentTime;
		gainEnvNode.gain.cancelScheduledValues( now );
		// The rest of the code is for new starts or restarts	
		stopTime = bigNum;

		// if no input, remember from last time set
		m_freq = i_freq ? i_freq : m_freq;
		myInterface.setCenterFreq(m_freq);
		gainLevelNode.gain.value = i_gain ? i_gain : m_gainLevel;
		
		// linear ramp attack isn't working for some reason (Canary). It just sets value at the time specified (and thus feels like a laggy response time).
		foo = now + m_attackTime;
		//console.log( "   ramp to level " + gainLevelNode.gain.value + " at time " + foo);
		gainEnvNode.gain.setValueAtTime(0, now);
		gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime); // go to gain level over .1 secs			
	};

	// ----------------------------------------
	myInterface.setCenterFreq= myInterface.registerParam("Center Frequency", 100, 2000, m_freq, 
		function(i_val){
			m_freq = i_val;
			m_filterNode.frequency.value = m_freq; 
		});
	// ----------------------------------------
	myInterface.setFilterQ= myInterface.registerParam("filter Q", 0, 150, m_Q, 
		function(i_val){
			m_Q = i_val;
			m_filterNode.Q.value = m_Q;
		});
		
	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam("Gain", 0, 2, m_gainLevel, 
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
	//--------------------------------------------------------------------------------
	// Other methods for the interface
	//----------------------------------------------------------------------------------
	myInterface.getFreq = function(){ return m_freq;};
	
	//console.log("paramlist = " + myInterface.getParamList().prettyString());					
	return myInterface;
}


