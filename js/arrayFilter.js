/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Sanger Institute code.
 *
 * The Initial Developer of the Original Code is The Sanger Institute.
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *    Tony Cox <avc@sanger.ac.uk> (original author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

	/**
	* 	Interop quality record
	*
	* 	rec.itype 	= 'quality_metric';
	* 	rec.lane   	= int;
	* 	rec.tile   	= int;
	* 	rec.cycle  	= int;
	* 	rec.surface = int;
	* 	rec.swath   = int;
	* 	rec.image   = int;
	* 	rec.qscore	= int[];
	*
 	**/

	const validFilterConstraint = {
									'lane':true,
									'cycle':true,
									'image':true,
									'qscore':true, // is this needed?
									'surface':true,
									'swath':true,
									'tile':true
								  };


	// Sum the qscore arrays for a list of quality records
	function sumQscores (data) {
		var sumQscore = [];
		var qscorePcTotal = [];
		var q30=0;
		var q40=0;
		var y=0;

		var j;
		for (j=0; j<data.length;j++){
			var q = data[j]['qscore'];
			for (i=1; i<q.length;i++){
				var c = q[i];
				sumQscore[i] = c + (sumQscore[i] || 0);
				y += c;
				if (i >=30){ q30 += c;}
				if (i >=40){ q40 += c;}
			}
		}
		for (j=0; j<sumQscore.length;j++){
			qscorePcTotal[j] = (sumQscore[j] / y) * 100;
			dump(j + '\t' + sumQscore[j] + '\t' + qscorePcTotal[j] + ' %\n');
		}
		dump("Tot Yield: " + y + '\n');
		dump("Q30 Yield: " + q30 + ' ' + (q30/y)*100 + ' %\n');
		dump("Q40 Yield: " + q40 + ' ' + (q40/y)*100 + ' %\n');
		return sumQscore;
	}


	/**
	*
	* Filter constraint objects must have a type and either a <value> or
	* a <range> between an <upper> and <lower> bound. If <range> is specified
	* both <upper> and <lower> must be provided. If <value> is null then the
	* filter is ignored. A single value <range> is treated as a <value>
	* e.g.
	* { type:lane, value:1 }
	* or
	* { type:lane, range:{upper:8,lower:4}}
	*
	* <type> list:  'lane','cycle','image','qscore','surface','swath','tile'
	*
	**/
	function filterQualityArray(data,cList) {

		// no data
		if(data == undefined){ return null;}

		// no constraints so return all data
		if(cList == undefined){ return data;}

		// range filter boolean
		var r = false;
		// constrain, upper limit, lower limit, value
		var c,u,l,v;

		// loop over constraints
		for (j=0; j<cList.length;j++){
			var c = cList[j];
			// filtered array
			var tmp = [];
			// constraint type:
			if(!validFilterConstraint[c.type]){
				dump("Invalid constraint type: " + c.type + '\n');
				continue;
			}
			var type = c.type;
			dump("constraint type: " + type + '\n');
			// is this a range filter
			if(c.range != undefined){
				// set range flag
				r = true;
				// get upper/lower bound
				if(c.range.upper == undefined || c.range.lower == undefined){
					throw("Range filter must have upper and lower bounds!\n");
				}
				// optimize away single value ranges
				if(c.range.upper == c.range.lower){
					c.value = c.range.upper;
					v = c.value;
					r = false;
					dump("cons value (opt): " + v + '\n');
				} else {
					u = c.range.upper;
					l = c.range.lower;
					// fix broken ranges
					if(u<l){
						var swap = u;
						u = l;
						l = swap;
					}
					dump("Range - upper: " + u + '\tlower: ' + l +'\n' );
				}
			} else if(c.value != undefined){
				// not a range - exact match
				v = c.value;
				dump("cons value: " + v + '\n');
			} else {
				// no value, no range - so no filter
				return data;
			}
			var i;
			// loop over data
			for (i=0; i<data.length; i++){
				// if not a range
				if(!r){
					// data is an array of values
					// Is element <value> > 0?
					if(typeof data[i][type] == "object"){
						var a = data[i][type];
						if (a[v] > 0){
							tmp.push(data[i]);
						}
					// data is a simple value
					} else {
						// does constraint value match data?
						if (data[i][type] == v){
							// store matching element
							tmp.push(data[i]);
						}
					}
				// it is a range
				}
				if (r){
					// data is an array of values
					// Is array[<lower>]...array[<upper>] > 0?
					if(typeof data[i][type] == "object"){
						var a = data[i][type];
						var k;
						for(k=l;k<=u;k++){
							if (a[k] > 0){
								tmp.push(data[i]);
							}
						}
					// data is a simple value
					} else {
						// is <type> data within constraint range
						if ((data[i][type] <= u) && (data[i][type] >= l)){
							// store matching element
							tmp.push(data[i]);
						}
					}
				}
			}
			// set data to be the filtered list
			data = tmp;
		}
		return(data);
	}
