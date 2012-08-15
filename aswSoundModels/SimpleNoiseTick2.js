/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
    for baseSM and fmodOscFactory
	
utils/utils.js
	for Array.prototype.prettyString 
*/

/* --------------------------------------------------------------
	Just a short blast of noise
******************************************************************************************************
*/

var aswSimpleNoiseTickFactory2 = function(){
	var m_attack=0.002;
	var m_sustain=0.01;
	var m_release=0.002;
	var m_gain = 0.40;

	var stopTime = 0.0;        // will be > audioContext.currentTime if playing
	var now;
	//var val;
	
	var noiseNode = noiseNodeFactory();
	var	gainEnvNode = audioContext.createGainNode();
		
	noiseNode.connect(gainEnvNode);
	gainEnvNode.gain.setValueAtTime(0, 0);
	gainEnvNode.connect(audioContext.destination);
	

	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_gain){
		myInterface.qplay(0, i_gain);	
	};

		// ----------------------------------------
	myInterface.qplay = function(i_ptime, i_gain){	
		now = audioContext.currentTime;
		var ptime = Math.max(now, i_ptime || now);
		
		gainEnvNode.gain.cancelScheduledValues( ptime );
		// The model turns itself off after a fixed amount of time	
		stopTime = ptime + m_attack+m_sustain+m_release;

		// Generate the "event"
		gainEnvNode.gain.setValueAtTime(0, ptime);	
		gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack); 		
		gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack + m_sustain); 			
		gainEnvNode.gain.linearRampToValueAtTime(0,      ptime + m_attack + m_sustain + m_release); 			
	};

		
	// ----------------------------------------		
	myInterface.setGain = myInterface.registerParam(
		"Gain",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_gain
                },
		function(i_val) {
			m_gain = parseFloat(i_val);
		}
	);

	// ----------------------------------------		
	myInterface.setAttackTime = myInterface.registerParam(
		"Attack Time",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_attack
                },
		function(i_val) {
			m_attack = parseFloat(i_val);  // javascript makes me cry ....
		}
	);

	// ----------------------------------------		
	myInterface.setSustainTime = myInterface.registerParam(
		"Sustain Time",
                "range",
                {
                        "min": 0,
                        "max": 3,
                        "val": m_sustain
                },
		function(i_val) {
			m_sustain = parseFloat(i_val); // javascript makes me cry ....
		}
	);

	// ----------------------------------------		
	myInterface.setReleaseTime = myInterface.registerParam(
		"Release Time",
                "range",
                {
                        "min": 0,
                        "max": 3,
                        "val": m_release
                },
		function(i_val) {
			m_release = parseFloat(i_val); // javascript makes me cry ....
		}
	);

		
	//console.log("paramlist = " + myInterface.getParamList().prettyString());					
	return myInterface;
}


