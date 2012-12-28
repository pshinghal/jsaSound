/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/* #INCLUDE
jsaComponents/jsaAudioComponents.js
    for baseSM and fmodOscFactory
	
jsaUtils/utils.js
	for Array.prototype.prettyString 
		*/

/* --------------------------------------------------------------
	Just a short blast of noise
******************************************************************************************************
*/

define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/baseSM", "jsaSound/jsaOpCodes/jsaNoiseNode"],
	function (config, baseSM, noiseNodeFactory) {
		return function () {
			var m_attack = 0.002;
			var m_sustain = 0.01;
			var m_release = 0.002;
			var m_gain = 0.40;

			var stopTime = 0.0;        // will be > audioContext.currentTime if playing
			var now;
			//var val;

			var noiseNode = noiseNodeFactory();
			var	gainEnvNode = config.audioContext.createGainNode();

			noiseNode.connect(gainEnvNode);
			gainEnvNode.gain.setValueAtTime(0, 0);
			gainEnvNode.connect(config.audioContext.destination);

			var myInterface = baseSM();

			myInterface.play = function (i_gain) {
				myInterface.qplay(0, i_gain);
			};

			myInterface.qplay = function (i_ptime, i_gain) {
				now = config.audioContext.currentTime;
				var ptime = Math.max(now, i_ptime || now);

				gainEnvNode.gain.cancelScheduledValues(ptime);
				// The model turns itself off after a fixed amount of time	
				stopTime = ptime + m_attack + m_sustain + m_release;

				// Generate the "event"
				gainEnvNode.gain.setValueAtTime(0, ptime);
				gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack);
				gainEnvNode.gain.linearRampToValueAtTime(m_gain, ptime + m_attack + m_sustain);
				gainEnvNode.gain.linearRampToValueAtTime(0, ptime + m_attack + m_sustain + m_release);
			};

			myInterface.registerParam(
				"Gain",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_gain
				},
				function (i_val) {
					m_gain = parseFloat(i_val);
				}
			);

			myInterface.registerParam(
				"Attack Time",
				"range",
				{
					"min": 0,
					"max": 1,
					"val": m_attack
				},
				function (i_val) {
					m_attack = parseFloat(i_val);  // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Sustain Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_sustain
				},
				function (i_val) {
					m_sustain = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			myInterface.registerParam(
				"Release Time",
				"range",
				{
					"min": 0,
					"max": 3,
					"val": m_release
				},
				function (i_val) {
					m_release = parseFloat(i_val); // javascript makes me cry ....
				}
			);

			//console.log("paramlist = " + myInterface.getParamList().prettySstring());					
			return myInterface;
		};
	}
);