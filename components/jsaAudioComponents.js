/*
Author: Lonce Wyse
Date: July 2012
*/
/* Audio Components
   This file contains the base models that all object should use as a prototype.
   It also contains JavaScriptNodes that can be use for building sound models.
   
   
*/

//-----------------------------------------------------------
// All sound models need an audioContext
if( ! window.webkitAudioContext ){
	alert("Web Audio API is not supported. Try Chrome!");
}
// This file of code needs an instantiated webkitAudioContext in order to load, so we can't wait for the
// html window to be loaded before creating audioContext even though it might cause errors if WebAudio isn't supported. 
var audioContext= new webkitAudioContext();
var bigNum = 10000000000.0; // Infinity;  
var k_bufferLength=1024;		// What is the right way to set the so that all nodes agree? 

//==============================================================================
// The sound model base class
//==============================================================================
var baseSM = function(){

	var paramList=[];
	var p; // a temporary parameter used in setParamNorm to point to one of the registered parameter info structures
	
	var bsmInterface = {};
	
	// This cannot be "private" because the inhereters need it - too bad it cannot be hidden from the users!!
	// i_name = String
	// i_val = Object of values
	// i_f = function
	bsmInterface.registerParam = function(i_name, i_type, i_val, i_f){
		var a={
			"name": i_name,
			"type": i_type,
			"value": i_val,
			"f": i_f
		};
		//console.log("array of args is " + a.prettyString());
		paramList[paramList.length]=a;
		return i_f;
	}
	
	bsmInterface.getParamList = function(){
			return paramList;			
	}
	
//FIND A NEW WAY TO DO THIS!!!
//	// A "generic" way to set parameters, identifying them with their index on the paramList, and using a [0,1] normalized value range
	bsmInterface.setRangeParamNorm = function(i_pID, i_val){
		if (i_pID < paramList.length){	
			p=paramList[i_pID];
			p.f(p.value.min+i_val*(p.value.max-p.value.min));   // pfunc(pmin+i_Val*(pmax-pmin)) // ... javascript makes me laugh
		}
	}
	
	// all sound models need to have these methods
	bsmInterface.play = function(){
		console.log("baseSM.play() should probably be overriden ");
	};
	bsmInterface.release = function(){
		console.log("baseSM.release() should probably be overriden ");
		};
	bsmInterface.stop = function(){
	   console.log("baseSM.stop() should probably be overriden ");
	};
	
	return bsmInterface;
}

//========================================================================================
// Javascript Node 1-input oscilator for a-rate frequency modulation
//========================================================================================
var fmodOscFactory = function(){   
	var sampleRate = audioContext.sampleRate;   // NOT THE RIGHT WAY TO SET THIS - PASS IN AUDIOCONEXT AS ARG???
	var k_twoPIbySR = Math.PI*2.0/sampleRate;
	var m_phase=0.0;
	var m_baseFreq=440.0;
	var m_modIndex=1.0;
	var m_phaseIncrement=0.0;
	
	var fmodOsc = audioContext.createJavaScriptNode(k_bufferLength, 1, 1);
	// Provide a couple of interface methods to the Node ----------------
	//------------------------
	fmodOsc.setFreq = function(i_f){
		//console.log("setFreq = " + i_f);
		var fooInc  = k_twoPIbySR * (m_baseFreq+m_modIndex);  ///////////////////CHECK   
		//console.log(" will set inc to " + fooInc);
		m_baseFreq = i_f;
	};
	//------------------------
	fmodOsc.setModIndex = function(i_index){
		m_modIndex = i_index;
	};
	//------------------------
	fmodOsc.setPhase = function(i_phase){
		m_phase = i_phase;
	};

	//-------------------------------------------------------------------
	// Compute the sine wave with sample-rate frequency updating from the connected input 
	fmodOsc.onaudioprocess = function (e) {
		var outBuffer = e.outputBuffer.getChannelData(0);
		var inBuffer = e.inputBuffer.getChannelData(0);
				
		 for (var i = 0; i < k_bufferLength; ++i) {
			m_phaseIncrement = k_twoPIbySR * (m_baseFreq+m_modIndex*inBuffer[i]);
            outBuffer[i] = Math.sin(m_phase);
			m_phase = m_phase + m_phaseIncrement;
        }
    }	
	return fmodOsc;
}

//========================================================================================
// Javascript Node for gaussian noise
//
var noiseNodeFactory = function (){ 
	var noiseSource = audioContext.createJavaScriptNode(k_bufferLength, 1, 1);
	var w = 1; // for gaussian noise, this is the standard deviation, for white, this is the max absolute value
	var noisetype = "gaussian";
	noiseSource.onaudioprocess = function (e) {
		var outBuffer = e.outputBuffer.getChannelData(0);
		if (noisetype==="gaussian"){
			for (var i = 0; i < k_bufferLength; i++) {
				outBuffer[i] = Math.nrand(0,w); // Math.random() * 2 - 1;
			};
		} else {
			for (var i = 0; i < k_bufferLength; i++) {
				outBuffer[i] = w*(Math.random() * 2 - 1);
			};		
		}
	};
	//------------------------
	noiseSource.setWidth = function(i_index){
		w = i_index;
	};

	//------------------------
	noiseSource.setType = function(i_type){
		if (! (i_type === "gaussian") || (i_type === "white")) {
			console.log("invalid noise type");
		}
		noisetype = i_type;
	};

	return noiseSource;
}
//================================================
// Phasor - values in [0,1], needs to be initialized with a phase and the current time, 
//
var jsaEventPhasor = function () {
    var m_phase=0;
    var m_freq=1; // seconds
    var m_currentPhase=0; [0,1]
	var m_currentTime;
   
    myInterface = {};

    myInterface.setCurrentTime = function(i_t){
        m_currentTime=i_t;
    }
	
    myInterface.setPhase = function(i_p){
        m_phase=i_p;
    }
   
    myInterface.setFreq = function(i_f){
        m_freq=i_f;    
    }   
   
    myInterface.advance = function(i_t){
        m_currentPhase = (m_currentPhase+i_t*m_freq)%1;   
    }
	
	myInterface.advanceToTime = function(i_t){
		advance = i_t-m_currentTime;
        m_currentPhase = (m_currentPhase+advance*m_freq)%1;
		m_currentTime=i_t;
    }
	myInterface.advanceToTick = function(){
		m_currentTime += (1-m_currentPhase)/m_freq;;
        m_currentPhase = 0.00000000000001;	// Don't want 0 as a nextTickTime
    }
	
	myInterface.nextTickTime = function(){
        if (m_freq === 0){
            return bigNum;
        } else {        
            return m_currentTime + (1-m_currentPhase)/m_freq;
        }
    }    

    myInterface.timeToTick = function(){
        if (m_freq === 0){
            return bigNum;
        } else {        
            return (1-m_currentPhase)/m_freq;
        }
    }    
    return myInterface;
}
