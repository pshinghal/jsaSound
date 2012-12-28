/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//================================================
// Phasor - values in [0,1], needs to be initialized with a phase and the current time,
//================================================
//PARA: config
//		-bigNum
define(
	["jsaSound/jsaCore/config"],
	function (config) {
		return function () {
			if (!config) {
				console.log("No config passed to jsaEventPhasor");
			}

			var m_phase = 0;
			var m_freq = 1; // seconds
			var m_currentPhase = 0; //[0,1]
			var m_currentTime;

			var myInterface = {};

			myInterface.setCurrentTime = function (i_t) {
				m_currentTime = i_t;
			};

			myInterface.setPhase = function (i_p) {
				m_phase = i_p;
			};

			myInterface.setFreq = function (i_f) {
				m_freq = i_f;
			};

			myInterface.advance = function (i_t) {
				m_currentPhase = (m_currentPhase + i_t * m_freq) % 1;
			};

			myInterface.advanceToTime = function (i_t) {
				var advance = i_t - m_currentTime;
				m_currentPhase = (m_currentPhase + advance * m_freq) % 1;
				m_currentTime = i_t;
			};

			myInterface.advanceToTick = function () {
				m_currentTime += (1 - m_currentPhase) / m_freq;
				m_currentPhase = 0.00000000000001;	// Don't want 0 as a nextTickTime
			};

			myInterface.nextTickTime = function () {
				if (m_freq === 0) {
					return config.bigNum;
				}
				return m_currentTime + (1 - m_currentPhase) / m_freq;
			};

			myInterface.timeToTick = function () {
				if (m_freq === 0) {
					return config.bigNum;
				}
				return (1 - m_currentPhase) / m_freq;
			};

			return myInterface;
		};
	}
);