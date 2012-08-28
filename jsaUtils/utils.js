/* ---------------------------------------------------------------------------------------
This jsaSound Code is distributed under LGPL 3
Copyright (C) 2012 National University of Singapore
Inquiries: director@anclab.org

This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation; either version 3 of the License, or any later version.
This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNULesser General Public License for more details.
You should have received a copy of the GNU General Public License and GNU Lesser General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>
------------------------------------------------------------------------------------------*/
/*
Author: Lonce Wyse
Date: July 2012
*/
var Debugger = function () { };
Debugger.log = function (message) {
	try {
			console.log(message);
		} catch (exception) {
		return;
		}
}

// Print out the array with brackets - for 2D arrarys, print each "sub" array on a separate line
Array.prototype.prettyString = function () {
	var s="[";
	var i;
	for(i=0;i<this.length;i++){
		if (Array.isArray(this[i])){
			s+=this[i].prettyString();
			if (i<(this.length-1)) s+=",\n";
		} else{
		s+= this[i].toString();
		if (i<(this.length-1)) s+=", ";
		}
	}
	s += "]";
	return s;   
}

	
//---------------------
// give the HTMLCanvasElement relative mouse coordinates {[0,1],[0,1]} 
// args: 
function relMouseCoords(event){
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var canvasX = 0;
		var canvasY = 0;
		var currentElement = this;

		do{
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		}
		while(currentElement = currentElement.offsetParent)

		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;

		return {x:canvasX, y:canvasY}
	}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

//-----------------------------------
//http://www.meredithdodge.com/2012/05/30/a-great-little-javascript-function-for-generating-random-gaussiannormalbell-curve-numbers/
// Normally distributed random numbers
Math.nrand = function(m, sd) {
	var x1, x2, rad, y1;
	do {
		x1 = 2 * this.random() - 1;
		x2 = 2 * this.random() - 1;
		rad = x1 * x1 + x2 * x2;
	} while(rad >= 1 || rad == 0);
	var c = this.sqrt(-2 * Math.log(rad) / rad);
	return (x1 * c)*sd +m;
};

// midi note number to frequency conversion 
function mtof(m) {
  return Math.pow(2, (m - 69) / 12) * 440;
}

function mapconstrain(f1, f2, t1, t2, x){
   var raw = t1 + ((x-f1)/(f2-f1)) * (t2-t1);
   return Math.max(t1, Math.min(raw, t2));
}

/*
This is a rational function to approximate a tanh-like soft clipper. It is based on the pade-approximation of the tanh function with tweaked coefficients.
The function is in the range x=-3..3 and outputs the range y=-1..1. Beyond this range the output must be clamped to -1..1.
The first to derivatives of the function vanish at -3 and 3, so the transition to the hard clipped region is C2-continuous.
http://stackoverflow.com/questions/6118028/fast-hyperbolic-tangent-approximation-in-javascript
*/
function rational_tanh(x) {
    if( x < -3 )
        return -1;
    else if( x > 3 )
        return 1;
    else
        return x * ( 27 + x * x ) / ( 27 + 9 * x * x );
}

