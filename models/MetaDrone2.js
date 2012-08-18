/* #INCLUDE
components/jsaAudioComponents.js
    for baseSM and fmodOscFactory

filteredNoiseBand.js
	for jsaFilteredNoiseBandFactory()
	
utils/utils.js
	for Array.prototype.prettyString 
*/

/* --------------------------------------------------------------
	This drone model was inspired by a Matt Diamond post to the public-audio@w3.org list.
	
	The idea here is to have one sound model control a bunch of others.
	Architecture:
		MetaDrone1 has an array of noisyFM soundmodles that it starts, stops, and controls through paramters. 
******************************************************************************************************
*/
var jsaMetaDrone2Factory = function(){
	var	childModel = [];
	var k_maxNumChildren=12;
	
	var m_currentNumChildrenActive=6;	
	var m_baseNote=69; 
	var m_metagain=.6;
	
	
	var stopTime=0.0;        // will be > audioContext.currentTime if playing
	var now=0.0;
	
	// These numbers are semitones to be used relative to a "base note" 
	var scale = [0.0, 2.0, 4.0, 6.0, 7.0, 9.0, 11.0, 12.0, 14.0];
	
	// get a frequency as a random function of the base_note
	var note2Freq = function(i_baseNote){
		var degree = Math.floor(Math.random() * scale.length);
		var freq = mtof(i_baseNote + scale[degree]);
		return freq;
	}	

	// Init runs once when the sound model is constructed only
	var foo=0;
	var init = function(){
		for (var i=0;i<k_maxNumChildren;i++){
			childModel[i] = jsaFilteredNoiseBandFactory();
			childModel[i].setFilterQ(150);
			childModel[i].setGain(m_metagain);
			foo = note2Freq(m_baseNote);
			childModel[i].setCenterFreq(foo); 
		}
	}();
	

	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_bn){	
		now = audioContext.currentTime;
		stopTime = bigNum;
		console.log("Drone: PLAY! time = " + now);

		if (stopTime <= now){ // not playing
			//buildModelArchitecture();
		} else {  // no need to recreate architectre - the old one still exists since it is playing
			//gainEnvNode.gain.cancelScheduledValues( now );
		}
		
		m_baseNote = i_bn ? i_bn : m_baseNote;
		console.log("will send play to " + m_currentNumChildrenActive + " currently active children");
		for (var i=0;i<m_currentNumChildrenActive;i++){
			childModel[i].play(note2Freq(m_baseNote));  
		}
	};
	
		// ----------------------------------------
	myInterface.release = function(){
		now = audioContext.currentTime;
		stopTime = now;
		console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
		console.log("will send release to " + m_currentNumChildrenActive + " currently active children");
		for (var i=0;i<m_currentNumChildrenActive;i++){
			childModel[i].release();  
		}
		
		console.log("------------");

	};

	
	// ----------------------------------------
	//	Parameters 
	// ----------------------------------------
	myInterface.setBN= myInterface.registerParam(
		"Base Note",
                "range",
                {
                        "min": 40,
                        "max": 100,
                        "val": m_baseNote
                },
		function(i_bn){
			var in_bn=parseInt(i_bn);
			if (in_bn === m_baseNote) return; // args come in as floats, so we test if the parseInt is the same as baseNote
			
			var bndif = in_bn-m_baseNote;
			console.log("will send new base note to " + m_currentNumChildrenActive + " currently active children");
			for (var i=0;i<m_currentNumChildrenActive;i++){
				//childModel[i].setCenterFreq(note2Freq(m_baseNote));  // reassign freqs
				childModel[i].setCenterFreq(childModel[i].getFreq()*Math.pow(2, bndif/12));  // glide freqs
			}
			m_baseNote = in_bn; 
			}
	);
			
	// ----------------------------------------		
	myInterface.setNumGenerators = myInterface.registerParam(
		"Number of Generators",
                "range",
                {
                        "min": 0,
                        "max": 10,
                        "val": m_currentNumChildrenActive
                }, 
		function(i_gens){
			var in_gens=parseInt(i_gens);
			if (in_gens === m_currentNumChildrenActive) return; 
			
			if (in_gens > m_currentNumChildrenActive){
				for (var i=m_currentNumChildrenActive; i<in_gens; i++){
					console.log("setNumGenerators: will add child to playing list # " + i);
					var f = note2Freq(m_baseNote);
					childModel[i].setGain(m_metagain);
					childModel[i].play(f);	
				}
			}
			else{ // in_gens < m_currentNumChildrenActive
				for (var i=in_gens; i< m_currentNumChildrenActive; i++){
					console.log("setNumGenerators: will remove child from playing list # " + i);
					childModel[i].release();	
				}
			};
			m_currentNumChildrenActive = in_gens;
			console.log("setNumGenerators: EXITING  after setting m_currentNumChildrenActive ("+m_currentNumChildrenActive +") to in_gens ("+in_gens+")");
		}
	);

	// ----------------------------------------		
	// This just goes and set the gains of all the child sound models
	// It would be more efficient if child model audio was routed though a single metamodel gain node...
	myInterface.setGain = myInterface.registerParam(
		"Gain",
                "range",
                {
                        "min": 0,
                        "max": 2,
                        "val": m_metagain
                },
		function(i_val){
			m_metagain=i_val;
			for (var i=0; i<m_currentNumChildrenActive; i++){
				childModel[i].setGain(m_metagain);
			}
		}
	);

	
	//console.log("paramlist = " + myInterface.getParamList().prettyString());			
	return myInterface;
}



