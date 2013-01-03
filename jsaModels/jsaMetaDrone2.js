/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

/* --------------------------------------------------------------
	This drone model was inspired by a Matt Diamond post to the public-audio@w3.org list.
	
	The idea here is to have one sound model control a bunch of others.
	Architecture:
		MetaDrone1 has an array of other soundmodles that it starts, stops, and controls through paramters. 
******************************************************************************************************
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaCore/utils", "jsaSound/jsaModels/jsaFilteredNoiseBand"],
	function (config, baseSM, utils, jsaFilteredNoiseBandFactory) {
		return function () {
			var	childModel = [];
			var k_maxNumChildren = 12;

			var m_currentNumChildrenActive = 6;
			var m_baseNote = 69;
			var m_metagain = 0.6;

			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now = 0.0;

			// These numbers are semitones to be used relative to a "base note" 
			var scale = [0.0, 2.0, 4.0, 6.0, 7.0, 9.0, 11.0, 12.0, 14.0];

			// get a frequency as a random function of the base_note
			var note2Freq = function (i_baseNote) {
				var degree = Math.floor(Math.random() * scale.length);
				var freq = utils.mtof(i_baseNote + scale[degree]);
				return freq;
			};

			// Init runs once when the sound model is constructed only
			var foo = 0;
			var init = (function () {
				var i;
				for (i = 0; i < k_maxNumChildren; i += 1) {
					childModel[i] = jsaFilteredNoiseBandFactory();
					childModel[i].set("Filter Q", 150);
					childModel[i].set("Gain", m_metagain);
					foo = note2Freq(m_baseNote);
					childModel[i].set("Center Frequency", foo);
				}
			}());

			// define the PUBLIC INTERFACE for the model	
			var myInterface = baseSM();
			// ----------------------------------------
			myInterface.play = function (i_bn) {
				var i;
				now = config.audioContext.currentTime;
				stopTime = config.bigNum;
				//console.log("Drone: PLAY! time = " + now);

				m_baseNote = i_bn || m_baseNote;
				//console.log("will send play to " + m_currentNumChildrenActive + " currently active children");
				for (i = 0; i < m_currentNumChildrenActive; i += 1) {
					childModel[i].play(note2Freq(m_baseNote));
				}
			};

			myInterface.release = function () {
				var i;
				now = config.audioContext.currentTime;
				stopTime = now;
				//console.log("RELEASE! time = " + now + ", and stopTime = " + stopTime);
				//console.log("will send release to " + m_currentNumChildrenActive + " currently active children");
				for (i = 0; i < m_currentNumChildrenActive; i += 1) {
					childModel[i].release();
				}

				//console.log("------------[released]");
			};

			// ----------------------------------------
			//	Parameters 
			// ----------------------------------------
			myInterface.registerParam(
				"Base Note",
				"range",
				{
					"min": 40,
					"max": 100,
					"val": m_baseNote
				},
				function (i_bn) {
					var i;
					var in_bn = parseInt(i_bn, 10);
					if (in_bn === m_baseNote) {
						return; // args come in as floats, so we test if the parseInt is the same as baseNote
					}

					var bndif = in_bn - m_baseNote;
					//console.log("will send new base note to " + m_currentNumChildrenActive + " currently active children");
					for (i = 0; i < m_currentNumChildrenActive; i += 1) {
						//childModel[i].setCenterFreq(note2Freq(m_baseNote));  // reassign freqs
						childModel[i].set("Center Frequency", childModel[i].getFreq() * Math.pow(2, bndif / 12));  // glide freqs
					}
					m_baseNote = in_bn;
				}
			);

			myInterface.registerParam(
				"Number of Generators",
				"range",
				{
					"min": 0,
					"max": 10,
					"val": m_currentNumChildrenActive
				},
				function (i_gens) {
					var i;
					var in_gens = parseInt(i_gens, 10);
					if (in_gens === m_currentNumChildrenActive) {
						return;
					}

					if (in_gens > m_currentNumChildrenActive) {
						for (i = m_currentNumChildrenActive; i < in_gens; i += 1) {
							//console.log("setNumGenerators: will add child to playing list # " + i);
							var f = note2Freq(m_baseNote);
							childModel[i].set("Gain", m_metagain);
							childModel[i].play(f);
						}
					} else { // in_gens < m_currentNumChildrenActive
						for (i = in_gens; i < m_currentNumChildrenActive; i += 1) {
							//console.log("setNumGenerators: will remove child from playing list # " + i);
							childModel[i].release();
						}
					}
					m_currentNumChildrenActive = in_gens;
					//console.log("setNumGenerators: EXITING  after setting m_currentNumChildrenActive (" + m_currentNumChildrenActive + ") to in_gens (" + in_gens + ")");
				}
			);

			// ----------------------------------------		
			// This just goes and set the gains of all the child sound models
			// It would be more efficient if child model audio was routed though a single metamodel gain node...
			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 2,
					"val": m_metagain
				},
				function (i_val) {
					var i;
					m_metagain = i_val;
					for (i = 0; i < m_currentNumChildrenActive; i += 1) {
						childModel[i].set("Gain", m_metagain);
					}
				}
			);

			//console.log("paramlist = " + myInterface.getParamList().prettyString());			
			return myInterface;
		};
	}
);