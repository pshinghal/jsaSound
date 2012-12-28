/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//========================================================================================
// Javascript Node 1-input oscilator for a-rate frequency modulation
//========================================================================================
//PARA: config
//		-audioContext
//		-k_bufferLength
define(
	["jsaSound/jsaCore/config"],
	function (config) {
		return function () {
			var sampleRate = config.audioContext.sampleRate;   // NOT THE RIGHT WAY TO SET THIS - PASS IN AUDIOCONEXT AS ARG???
			var k_twoPIbySR = Math.PI * 2.0 / sampleRate;
			var m_phase = 0.0;
			var m_baseFreq = 440.0;
			var m_modIndex = 1.0;
			var m_phaseIncrement = 0.0;

			var fmodOsc = config.audioContext.createJavaScriptNode(config.k_bufferLength, 1, 1);
			// Provide a couple of interface methods to the Node
			fmodOsc.setFreq = function (i_f) {
				//console.log("setFreq = " + i_f);
				var fooInc  = k_twoPIbySR * (m_baseFreq + m_modIndex);  //CHECK
				//console.log(" will set inc to " + fooInc);
				m_baseFreq = i_f;
			};

			fmodOsc.setModIndex = function (i_index) {
				m_modIndex = i_index;
			};

			fmodOsc.setPhase = function (i_phase) {
				m_phase = i_phase;
			};

			// Compute the sine wave with sample-rate frequency updating from the connected input 
			fmodOsc.onaudioprocess = function (e) {
				var outBuffer = e.outputBuffer.getChannelData(0);
				var inBuffer = e.inputBuffer.getChannelData(0);
				var i;

				for (i = 0; i < config.k_bufferLength; i += 1) {
					m_phaseIncrement = k_twoPIbySR * (m_baseFreq + m_modIndex * inBuffer[i]);
					outBuffer[i] = Math.sin(m_phase);
					m_phase = m_phase + m_phaseIncrement;
				}
			};

			return fmodOsc;
		};
	}
);