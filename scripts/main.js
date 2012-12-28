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
		// "core": "../jsaCore",
		// "baseSM": "../jsaCore/baseSM",
		// "models": "../jsaModels",
		// "utils": "../jsaCore/utils",
		// "opCodes": "../jsaOpCodes",
		// "config": "../jsaCore/config",
		"jsaSound": ".."
	}
});
require(
	["require", "jsaSound/jsaCore/sliderBox"],
	function (require, makeSliderBox) {
		var currentSndModel;
		var soundSelectorElem = document.getElementById("soundSelector");

		//TODO: Have this auto-load from jsaModels contents (have an "all.json")
		//TODO: Then pull names from "<model>Data.json"
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
		function makeSoundListSelector() {
			var i;
			var currOptionName;
			for (i = 0; i < soundList.length; i += 1) {
				currOptionName = soundList[i].name || "";
				//Add option to end of list
				soundSelectorElem.add(new Option(currOptionName));
			}
		}

		// When a sound is selected
		function soundChoice() {
			var sb;
			require(
				// Get the model
				["jsaSound/jsaModels/" + soundList[soundSelectorElem.selectedIndex].model],
				// And open the sliderBox
				function (currentSM) {
					console.log("got model");
					sb = makeSliderBox(currentSM());
					console.log("made slider box");
				}
			);
		}

		//TODO: Find non-jQuery browser-agnostic way of doing this AFTER the window is loaded
		makeSoundListSelector();

		soundSelectorElem.addEventListener("change", soundChoice);
	}
);