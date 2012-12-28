/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/

//==============================================================================
// The sound model base class that all models use as a prototype
//==============================================================================
define(
	function () {
		return function () {
			console.log("baseSM constructor called");
			var params = {};

			var bsmInterface = {};

			// This cannot be "private" because the inhereters need it - too bad it cannot be hidden from the users!!
			// i_name = String
			// i_type = String
			// i_val = Object of values
			// i_f = Function

			// Parameters are over-writable
			bsmInterface.registerParam = function (i_name, i_type, i_val, i_f) {
				var paramObject = {
					"type": i_type,
					"value": i_val,
					"f": i_f
				};
				params[i_name] = paramObject;
			};

			bsmInterface.getParams = function () {
				return params;
			};

			bsmInterface.setRangeParamNorm = function (i_name, i_val) {
				if (!params[i_name]) {
					throw "setRangeParamNorm: Parameter " + i_name + " does not exist";
				}
				var p = params[i_name];
				p.f(p.value.min + i_val * (p.value.max - p.value.min));
			};

			bsmInterface.set = function (i_name) {
				if (!params[i_name]) {
					throw "set: Parameter " + i_name + " does not exist";
				}
				var args = [], i;
				for (i = 1; i < arguments.length; i += 1) {
					args.push(arguments[i]);
				}
				params[i_name].f.apply(this, args);
			};

			// All sound models need to have these methods
			bsmInterface.play = function () {
				console.log("baseSM.play() should probably be overriden ");
			};
			bsmInterface.release = function () {
				console.log("baseSM.release() should probably be overriden ");
			};
			bsmInterface.stop = function () {
				console.log("baseSM.stop() should probably be overriden ");
			};
			return bsmInterface;
		};
	}
);