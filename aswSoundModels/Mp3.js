function mp3Factory() {
	
	//Useful addition:
	//When the file finishes playing, change release time to 0;
	//otherwise it's confusing: Press release and it will wait for the release time, but won't really DO anything
	//user may just click play immediately, and the architecture won't be rebuilt, so noting will happen

	//CUrrently, I've just enabled looping to overcome that problem

	var buffLoaded = false, architectureBuilt = false;
	var xhr = new XMLHttpRequest();
	var soundBuff = null;

	var gainEnvNode, gainLevelNode, sourceNode;

	var m_gainLevel = .5;
	var m_attackTime = .05;
	var m_releaseTime = 1.0;
	var m_soundUrl = "./sounds/schumannLotusFlower.mp3";
	var stopTime = 0.0;
	var now = 0.0;
	
	var myInterface = baseSM();

	xhr.open('GET', m_soundUrl, true);
	xhr.responseType = 'arraybuffer';
	xhr.onerror = function(e) {
		console.error(e);
	}
	xhr.onload = function() {
		console.log("Sound(s) loaded");
		soundBuff = audioContext.createBuffer(xhr.response, false);
		buffLoaded = true;
		console.log("Buffer Loaded!");

		buildModelArchitecture();
	}
	function buildModelArchitecture() {
		sourceNode = audioContext.createBufferSource();
		gainEnvNode = audioContext.createGainNode();
		gainLevelNode = audioContext.createGainNode();

		sourceNode.buffer = soundBuff;
		sourceNode.loop = true;
		gainLevelNode.gain.value = m_gainLevel;
		gainEnvNode.gain.value = 0;

		sourceNode.connect(gainEnvNode);
		gainEnvNode.connect(gainLevelNode);
		gainLevelNode.connect(audioContext.destination);

		architectureBuilt = true;
	}
	xhr.send();

	myInterface.play = function (i_freq, i_gain) {
	//i_freq has NO role here, just putting it to ensure the calls with modified gains are made correctly
		if (buffLoaded) {
			now = audioContext.currentTime;
			if (stopTime <= now) {
				console.log("rebuilding");
				buildModelArchitecture();
				sourceNode.noteOn(now);
				gainEnvNode.gain.value = 0;
			} else {
				console.log("NOT re-building");
				gainEnvNode.gain.cancelScheduledValues(now);
			}
	
			stopTime = bigNum;
			sourceNode.noteOff(stopTime);
			
			gainLevelNode.gain.value = i_gain || m_gainLevel;
			console.log("Gain set at " + gainLevelNode.gain.value);
	
			gainEnvNode.gain.setValueAtTime(0, now);
			gainEnvNode.gain.linearRampToValueAtTime(gainLevelNode.gain.value, now + m_attackTime);
		} else {
			console.log("Buffer NOT loaded yet!");
		}
	};

        myInterface.setGain = myInterface.registerParam(
		"Gain",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_gainLevel
                },
                function(i_val){
	                gainLevelNode.gain.value = m_gainLevel = i_val;
        	}
	);

        myInterface.setAttackTime = myInterface.registerParam(
		"Attack Time",
                "range",
                {
                        "min": 0,
                        "max": 1,
                        "val": m_attackTime
                },
                function(i_val){
                	m_attackTime = parseFloat(i_val);
        	}
	);

        myInterface.setReleaseTime = myInterface.registerParam(
		"Release Time",
                "range",
                {
                        "min": 0,
                        "max": 3,
                        "val": m_releaseTime
                },
                function(i_val){
        	        m_releaseTime = parseFloat(i_val);
        	}
	);

	myInterface.setSoundUrl = myInterface.registerParam

        myInterface.release = function(){
                now = audioContext.currentTime;
                stopTime = now + m_releaseTime;

                gainEnvNode.gain.linearRampToValueAtTime(0, stopTime); 
                sourceNode.noteOff(stopTime);
		architectureBuilt = false; //probably
        };


	return myInterface;
}
