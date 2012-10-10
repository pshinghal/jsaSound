/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
var Debugger = function () {};
Debugger.log = function (message) {
	try {
		console.log(message);
	} catch (exception) {
		return;
	}
};

// Print out the array with brackets - for 2D arrarys, print each "sub" array on a separate line
Array.prototype.prettyString = function () {
	var s = "[";
	var i;
	for (i = 0; i < this.length; i += 1) {
		if (Array.isArray(this[i])) {
			s += this[i].prettyString();
			if (i < (this.length - 1)) {
				s += ",\n";
			}
		} else {
			s += this[i].toString();
			if (i < (this.length - 1)) {
				s += ", ";
			}
		}
	}
	s += "]";
	return s;
};