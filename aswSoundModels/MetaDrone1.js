/* #INCLUDE
aswAudioComponents/aswAudioComponents.js
    for baseSM and fmodOscFactory

noisyFM.js
	for noisyFMFactory()
	
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
var aswMetaDrone1Factory = function(){
	var	childModel = [];
	var k_maxNumChildren=10;
	
	var m_currentNumChildrenActive=2;	
	var m_baseNote=80; 
	
	var stopTime=0.0;        // will be > audioContext.currentTime if playing
	var now=0.0;
	
	// These numbers are semitones to be used relative to a "base note" 
	var scale = [0.0, 2.0, 4.0, 6.0, 7.0, 9.0, 11.0, 12.0, 14.0];
	
	// Init runs once when the sound model is constructed only
	//var init = function(){
		for (var i=0;i<k_maxNumChildren;i++){
			childModel[i] = aswNoisyFMFactory();
			childModel[i].setModIndex(400);
			//console.log("creating child # " + i);
		}
	//}();
	
	// get a frequency as a random function of the base_note
	var note2Freq = function(i_baseNote){
		var degree = Math.floor(Math.random() * scale.length);
		var freq = mtof(i_baseNote + scale[degree]);
		return freq;
	}	

	
	// (Re)create the nodes and thier connections.
	// Must be called everytime we want to start playing since nodes are *deleted* when they aren't being used.
	var buildModelArchitecture = function(){
		// nothing to do in a metamodel.  child.play() will do all the architecture (re)building for the child.
		// It will be different when all sound models become AudioNodes....
	}	

	// define the PUBLIC INTERFACE for the model	
	var myInterface = baseSM(); 	
	// ----------------------------------------
	myInterface.play = function(i_bn){	
		now = audioContext.currentTime;
		stopTime = bigNum;
		//console.log("Drone: PLAY! time = " + now);

		if (stopTime <= now){ // not playing
			//buildModelArchitecture();
		} else {  // no need to recreate architectre - the old one still exists since it is playing
			//gainEnvNode.gain.cancelScheduledValues( now );
		}
		
		m_baseNote = i_bn ? i_bn : m_baseNote;
		//console.log("will send play to " + m_currentNumChildrenActive + " currently active children");
		for (var i=0;i<m_currentNumChildrenActive;i++){
			childModel[i].play(note2Freq(m_baseNote));  
		}
	};
	
		// ----------------------------------------
	myInterface.release = function(){
		now = audioContext.currentTime;
		stopTime = now;
		//console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
		//console.log("will send release to " + m_currentNumChildrenActive + " currently active children");
		for (var i=0;i<m_currentNumChildrenActive;i++){
			childModel[i].release();  
		}
		
		//console.log("------------");

	};

	
	// ----------------------------------------
	//	Parameters 
	// ----------------------------------------
	myInterface.setBN= myInterface.registerParam("Base Note", 40, 100, m_baseNote, 
		function(i_bn){
			var in_bn=parseInt(i_bn);
			if (in_bn === m_baseNote) return; // args come in as floats, so we test if the parseInt is the same as baseNote
			
			m_baseNote = in_bn; 
			//console.log("will send new base note to " + m_currentNumChildrenActive + " currently active children");
			for (var i=0;i<m_currentNumChildrenActive;i++){
				childModel[i].setCarFreq(note2Freq(m_baseNote));  
			}
		});
			
	// ----------------------------------------		
	myInterface.setNumGenerators = myInterface.registerParam("Number of Generators", 0, 10, m_currentNumChildrenActive, 
		function(i_gens){
			var in_gens=parseInt(i_gens);
			if (in_gens === m_currentNumChildrenActive) return; 
			
			if (in_gens > m_currentNumChildrenActive){
				for (var i=m_currentNumChildrenActive; i<in_gens; i++){
					//console.log("setNumGenerators: will add child to playing list # " + i);
					var f = note2Freq(m_baseNote);
					childModel[i].play(f);	
				}
			}
			else{ // in_gens < m_currentNumChildrenActive
				for (var i=in_gens; i< m_currentNumChildrenActive; i++){
					//console.log("setNumGenerators: will remove child from playing list # " + i);
					childModel[i].release();	
				}
			};
			m_currentNumChildrenActive = in_gens;
			//console.log("setNumGenerators: EXITING  after setting m_currentNumChildrenActive ("+m_currentNumChildrenActive +") to in_gens ("+in_gens+")");
		});

	
	console.log("paramlist = " + myInterface.getParamList().prettyString());			
	return myInterface;
}



