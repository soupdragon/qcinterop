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

let EXPORTED_SYMBOLS = ["BinUtils"];

////////////////////////////////////////////////////////////////////////////////
//// Constants

///////////////////////////////////////////////////////////////////////////////
// Low level routines to parse data types out of a binary stream.
// Makes extensive use of javascript typed arrays for data type conversion.
// TODO: Handle Uint64 properly by nasty bit fiddling
//	* There may be much more efficent ways to read multiple bytes rather than
//	* sequential Uint8s
///////////////////////////////////////////////////////////////////////////////

const BinUtils = {

	PR_UINT32_MAX: 	0xffffffff,
	UINT32: 		4,
	UINT16: 		2,
	UINT8: 			1,
	FLOAT32: 		4,

    /**
    * Function to read a Float32 from an nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param int count
    *        number of byes to read
    *
    * @return Either single or array of Float32
	*
    * Test case: 0x41a8147b -> 21.010000228881836
	**/
	readFloat32: function(stream,count) {
		if(count != undefined){
			var u = new Uint8Array(stream.readByteArray(BinUtils.FLOAT32 * count));
			return new Float32Array(u.buffer);
		}
		var u = new Uint8Array(stream.readByteArray(BinUtils.FLOAT32));
		return new Float32Array(u.buffer)[0];
	},


    /**
    * Function to read a Uint32 from a nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param int count
    *        number of byes to read
    *
    * @return Either single or array of Uint32
	*
	**/
	readUint32: function(stream,count) {
		if(count != undefined){
			var u = new Uint8Array(stream.readByteArray(BinUtils.UINT32 * count));
			return new Uint32Array(u.buffer);
		}
		var u = new Uint8Array(stream.readByteArray(BinUtils.UINT32));
		return new Uint32Array(u.buffer)[0];
	},


    /**
    * Function to read a Uint16 from a nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param int count
    *        number of byes to read
    *
    * @return Either single or array of Uint16
	*
	**/
	readUint16: function(stream,count) {
		if(count != undefined){
			var u = new Uint8Array(stream.readByteArray(BinUtils.UINT16 * count));
			return new Uint16Array(u.buffer);
		}
		var u = new Uint8Array(stream.readByteArray(BinUtils.UINT16));
		return new Uint16Array(u.buffer)[0];
	},


    /**
    * Function to read a Uint8 from a nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param int count
    *        number of byes to read
    *
    * @return Either single or array of Uint8
	*
	**/
	readUint8: function(stream,count) {
		if(count != undefined){
			return new Uint8Array(stream.readByteArray(BinUtils.UINT8 * count));
		}
		return stream.read8();
	},

    /**
    * Function to read a char string from a nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param len
    *        The number of bytes to read from the stream
    *
    * @return An ASCII string representation of the bytes read
	*
	**/
	readCharString: function(stream,len) {
		var i =0;
		var s = new String;
		while (i<len){
			var c = String.fromCharCode(stream.read8());
			s = s.concat(c);
			i++;
		}
		return s;
	},

    /**
    * Function to read a hex string from a nsIBinaryInputStream
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    * @param len
    *        The number of bytes to read from the stream
    *
    * @return An hexadecimal string representation of the bytes read
	*
	**/
	readHexString: function(stream,len) {
		var i =0;
		var s = new String;
		while (i<len){
			var c = stream.read8();
			s = s.concat(c.toString(16));
			i++;
		}
		return s;
	},

};
