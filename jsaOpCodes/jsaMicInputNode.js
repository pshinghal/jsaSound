define(
	["jsaSound/jsaCore/config"],
	function (config) {
		return function (microphone, connect_to) {
			//var microphone = i_microphone;
			//var connect_to = i_connect_to;

			function gotAudio(stream) {
				console.log("in gotAudio, audioContext is " + config.audioContext);
				microphone = config.audioContext.createMediaStreamSource(stream);
				console.log("in gotAudio,  microphone is "  + microphone + ", and we are connecting to " + connect_to);
				microphone.connect(connect_to);
			}

			function error() {
    			alert('Stream generation failed.');
			}


			try{
					//mediaGetter({audio:true}, gotAudio, error);
				navigator.webkitGetUserMedia({audio:true}, gotAudio, error);
			} catch(e){
				alert('webkitGetUserMedia threw exception :' + e);
			}

		};
	}
);