/*
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
*/
require.config({
	paths: {
		"core": "../jsaCore",
		"baseSM": "../jsaCore/baseSM",
		"models": "../jsaModels",
		"utils": "../jsaCore/utils",
		"opCodes": "../jsaCore",
		"config": "../jsaCore/config"
	}
});
require(
	["require", "core/sliderBox"],
	function (require, makeSliderBox) {
		var currentSndModel;
		var soundSelectorElem = document.getElementById("soundSelector");

		// Names are arbitrary, makers must be defined in the "#include"ed sound model files above
		var soundList = [
			{},
			{name: "Square Wave", model: "jsaOsc"},
			{name: "Classic FM", model: "jsaFM"},
			{name: "Noisy FM", model: "jsaNoisyFM"},
			{name: "UglyMetadrone", model: "jsaMetaDrone1"},
			{name: "Noise Band", model: "jsaFilteredNoiseBand"},
			{name: "Metadrone2", model: "jsaMetaDrone2"},
			{name: "ToneTick", model: "jsaToneTick"},
			{name: "NoiseTick", model: "jsaNoiseTick"},
			{name: "Simple Noise Tick 2", model: "jsaSimpleNoiseTick2"},
			{name: "Period Trigger 2", model: "jsaPeriodicTrigger2"},
			{name: "Mp3", model: "jsaMp3"},
			{name: "Granular Mp3", model: "jsaGranularMp3"},
			{name: "Mic Input", model: "jsaMicInput"}
		];

		// Create the html select box using the hard-coded soundList above
		//TODO: Tidy this up
		function makeSoundListSelector() {
			var foo;
			var i;
			for (i = 0; i < soundList.length; i += 1) {
				foo = soundList[i].name;
				if (soundList[i].name) {
					soundSelectorElem.options[soundSelectorElem.options.length] = new Option(soundList[i].name);
				} else {
					soundSelectorElem.options[soundSelectorElem.options.length] = new Option();
				}
			}
		}

		// responde to sound selections be loading a sound as the current model
		function soundChoice() {
			var sb;
			console.log("before requiring model");
			// currentSndModel = require("models/" + soundList[soundSelectorElem.selectedIndex].model);
			//console.log("required model");
			// sb = makeSliderBox(currentSndModel);
			// console.log("slider box is " + sb + " + and model is " + currentSndModel);
			require(
				["models/" + soundList[soundSelectorElem.selectedIndex].model],
				function (currentSM) {
					console.log("got model");
					sb = makeSliderBox(currentSM());
					console.log("made slider box");
				}
			);
		}

		//TODO: See if this can be used instead of direct call
		function eventWindowLoaded() {
			console.log("Window Loaded");
			console.log("IF YOU CAN SEE THIS, REFER TO TODO ABOVE THE STATEMENT THAT CALLS THIS!!!");
			// create the sound selector box for the web page
			makeSoundListSelector();
		}
		makeSoundListSelector();
		soundSelectorElem.addEventListener("change", soundChoice);
	}
);