/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
//========================================================================================
// Javascript Node for gaussian noise
//
//PARA: config
//		-audioContext
//		-k_bufferLength
define(
	["jsaSound/jsaCore/config", "jsaSound/jsaCore/utils"],
	function (config, utils) {
		return function () {
			var noiseSource = config.audioContext.createJavaScriptNode(config.k_bufferLength, 1, 1);
			var w = 1; // for gaussian noise, this is the standard deviation, for white, this is the max absolute value
			var noisetype = "gaussian";
			noiseSource.onaudioprocess = function (e) {
				var outBuffer = e.outputBuffer.getChannelData(0);
				var i;
				if (noisetype === "gaussian") {
					for (i = 0; i < config.k_bufferLength; i += 1) {
						outBuffer[i] = utils.nrand(0, w); // Math.random() * 2 - 1;
					}
				} else {
					for (i = 0; i < config.k_bufferLength; i += 1) {
						outBuffer[i] = w * (Math.random() * 2 - 1);
					}
				}
			};

			noiseSource.setWidth = function (i_index) {
				w = i_index;
			};

			noiseSource.setType = function (i_type) {
				if ((i_type !== "gaussian") && (i_type !== "white")) {
					console.log("invalid noise type");
				}
				noisetype = i_type;
			};

			return noiseSource;
		};
	}
);