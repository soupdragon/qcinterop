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
	* Binary InterOp file parsing routines
	* Most of the information on file parsing was derived from the Illumina
	* document "HCS1.4/RTA 1.12 Theory of Operation" dated 29 April 2011
	*
	* Flowcell image Numbers are interpreted as follows:
	*  First digit: 			surface	(1 - top, 2 - bottom)
	*  Second digit: 			swath #	(1,2 or 3)
	*  Two remaining digits:	tile # 	(01-08)
	*
	*   Flowcell Lane Map
	*
	*    Top Surface = 1
	*   Bottom Surface = 2
	*
	*
	*   <-----Lane------->
	*
	*         Swath
	*     1     2     3
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  1  |     |     |  <-Tile
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  2  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  3  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  4  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  5  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  6  |     |  X  |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  7  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*  |     |     |     |
	*  |  8  |     |     |
	*  |     |     |     |
	*  +-----+-----+-----+
	*
	*  X = 1306 (or 2306)
	*
	**/



	Components.utils.import("resource://gre/modules/NetUtil.jsm");
	Components.utils.import("resource://js/binUtils.js");


    /**
    * Function to initiate parse of an Interop file
    *
    * @param String interOpFileType
    *        The interop file type (see below)
    * @param nsiFile|nsIURI target
    *        The fully qualified path of the interop file to read from
    *
    * @return Array of record objects (see format below)
	* The only valid interOpFileType(s) are:
	*	ControlMetrics
	*	CorrectedIntMetrics
	*	ErrorMetrics
	*	ExtractionMetrics
	*	ImageMetrics
	*	QMetrics
	*	TileMetrics
	**/
	function parseInterOpFile(interOpFileType,target){

		// Called by asyncFetch when the file stream has been opened
		var parseBstream = function(istream,result,request) {
			if(!Components.isSuccessCode(result)){
				return;
			}
			var bstream = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
			bstream.setInputStream(istream);
			switch (interOpFileType){
				case "ControlMetrics":
					data = getControlMetrics(bstream);
					break;
				case "CorrectedIntMetrics":
					data = getCorrectedIntMetrics(bstream);
					break;
				case "ErrorMetrics":
					data = getErrorMetrics(bstream);
					break;
				case "ExtractionMetrics":
					data = getExtractionMetrics(bstream);
					break;
				case "ImageMetrics":
					data = getImageMetrics(bstream);
					break;
				case "QMetrics":
					data = getQualityMetrics(bstream);
					dump("Got " + data.length + " records pre filter\n");
					var cl = []; //constraint list

					//cl = [{type:'lane',value:1},{type:'surface',value:1},{type:'swath',value:3},{type:'cycle',value:100}];
					//cl = [{type:'tile',value:1101},{type:'cycle',value:100}];
					//cl = [{type:'tile',value:1101},{type:'lane',range:{upper:1,lower:7}}];
					//cl = [{type:'lane',value:1},{type:'surface',value:2},{type:'qscore',range:{lower:41,upper:42}}];
					//cl = [{type:'swath',value:3},{type:'lane',value:7},{type:'cycle',value:100},{type:'surface',value:2}];
					//cl = [{type:'lane',value:3}];
					//cl = [{type:'tile',value:1101}];
					cl = [{type:'lane',value:1}];

					data = filterQualityArray(data,cl);
					//for (i=0;i<data.length;i++){
					//	dump(oDump(data[i]) + '\n');
					//}
					dump("Got " + data.length + " records post filter\n");
					var q = sumQscores(data);
					//for (i=1;i<=q.length;i++){
					//	dump(q + ":\t" + q[i] + '\n');
					//}
					sendDataToDisplay(interOpFileType,q)
					break;

				case "TileMetrics":
					data = getTileMetrics(bstream);
					break;
				default:
					dump("Unknown InterOp file name!" + '\n');
			}
			QCDATA[interOpFileType] ={};
			QCDATA[interOpFileType]['data'] = data;
			QCDATA[interOpFileType]['isLoaded'] = true;
			LOG(QCDATA);
			dumpQcSummary()
		};

		try{
			// target must implement either the nsIFile, nsILocalFile or nsIURI interface
			if((target instanceof Components.interfaces.nsILocalFile) || (target instanceof Components.interfaces.nsIURI)){
				NetUtil.asyncFetch(target,parseBstream);
			} else {
				throw("Unrecognized request target: " + target.toString());
			}
		} catch(e){
			dump(e.toString());
		}
	}


    /**
    * Function to read TileMetricsOut.bin Interop file
	* Contains aggregate or read metrics by tile
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (2)
	* byte 1: length of each record
	* bytes (N * 10 + 2) - (N *10 + 11): record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: metric code (uint16)
	* 4 bytes: metric value (float)
	* Where N is the record index and possible metric codes are:
	* code 100: cluster density (k/mm2)
	* code 101: cluster density passing filters (k/mm2)
	* code 102: number of clusters
	* code 103: number of clusters passing filters
	* code (200 + (N – 1) * 2): phasing for read N
	* code (201 + (N – 1) * 2): prephasing for read N
	* code (300 + N – 1): percent aligned for read N
	* code 400: control lane
	*
	* Record map: BinUtils.UINT16 * 3 + BinUtils.FLOAT32)
	**/
	function getTileMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing TileMetrics" + '\n');
		dump("File version: " + version + ' ');
		dump("Record length: " + recLen + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'tile_metric';
			var u = new Uint8Array(bStream.readByteArray(6));
			var tmp = new Uint16Array(u.buffer,0,3);
			rec.lane   = tmp[0];
			rec.tile   = tmp[1];
			rec.metric = tmp[2];
			//dump("Lane "   + rec.lane   + ' ');
			//dump("Tile "   + rec.tile   + ' ');
			//dump("Metric " + rec.metric + ' ');
			u = new Uint8Array(bStream.readByteArray(4));
			tmp = new Float32Array(u.buffer,0,1);
			rec.value  = tmp[0];
			//dump("Value "  + rec.value  + '\n');
			data.push(rec);
			bytesAvailable -= recLen;
		}
		return data;
	}



    /**
    * Function to read ImageMetricsOut.bin Interop file
	* Contains min max contrast values for image
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (1)
	* byte 1: length of each record
	* bytes (N * 12 + 2) - (N *12 + 13): record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: cycle number (uint16)
	* 2 bytes: channel id (uint16) where 0=A, 1=C, 2=G, 3=T
	* 2 bytes: min contrast value for image (uint16)
	* 2 bytes: max contrast value for image (uint16)
	*
	* Record map: BinUtils.UINT16 * 6
	**/
	function getImageMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing ImageMetrics" + '\n');
		//dump("File version: " + version + ' ');
		//dump("Record length: " + recLen + '\n');
		var data = [];
		var channels = { 0:'A',1:'C',2:'G',3:'T'};
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'image_metric';
			var u = new Uint8Array(bStream.readByteArray(recLen));
			var tmp = new Uint16Array(u.buffer,0,6);
			rec.lane   = tmp[0];
			rec.tile   = tmp[1];
			rec.cycle  = tmp[2];
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Cycle " +  rec.cycle + '\n');
			rec.cId			= channels[tmp[3]];
			rec.minCnst  	= tmp[4];
			rec.maxCnst  	= tmp[5];
			//dump("Channel " 		+ rec.cId + ' ');
			//dump("Min contrast " 	+ rec.minCnst + ' ');
			//dump("Max contrast " 	+ rec.maxCnst + '\n');
			data.push(rec);
			bytesAvailable -= recLen;
		}
		return data;
	}


    /**
    * Function to read ControlMetricsOut.bin Interop file
	* Contains pull out information for Illumina in-line sample controls
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (1)
	* bytes (variable length): record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: read number (uint16)
	* 2 bytes: number bytes X for control name(uint16)
	* X bytes: control name string (string in UTF8Encoding)
	* 2 bytes: number bytes Y for index name(uint16)
	* Y bytes: index name string (string in UTF8Encoding)
	* 4 bytes: # clusters identified as control (uint32)
	*
	* Record map: BinUtils.UINT16 * 5 + BinUtils.UINT32 * 1 + cLen + iLen
	**/
	function getControlMetrics (bStream){
		var version = BinUtils.readUint8(bStream);
		dump("Parsing ControlMetrics" + '\n');
		//dump("File version: " + version + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'control_metric';
			//var tmp = BinUtils.readUint16(bStream,3);
			var u = new Uint8Array(bStream.readByteArray(6));
			var tmp = new Uint16Array(u.buffer,0,3);
			rec.lane  = tmp[0];
			rec.tile  = tmp[1];
			rec.read  = tmp[2];
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Read " +  rec.read + '\n');
			var cLen  = BinUtils.readUint16(bStream);
			rec.cName = BinUtils.readCharString(bStream,cLen);
			var iLen  = BinUtils.readUint16(bStream);
			rec.iName = BinUtils.readCharString(bStream,iLen);
			rec.numCtrlClust = BinUtils.readUint32(bStream);
			//dump("cName " 	+ rec.cName + ' ');
			//dump("iName " 	+ rec.iName + ' ');
			//dump("#CtlCls " + rec.numCtrlClust + '\n');
			data.push(rec);
			bytesAvailable -= (BinUtils.UINT16 * 5 + BinUtils.UINT32 * 1 + cLen + iLen);
		}
		return data;
	}


    /**
    * Function to read CorrectedIntOut.bin Interop file
	* Contains base call metrics
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (2)
	* byte 1: length of each record
	* bytes (N * 48 + 2) - (N *48 + 49): record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: cycle number (uint16)
	* 2 bytes: average intensity (uint16)
	* 2 bytes: average corrected int for channel A (uint16)
	* 2 bytes: average corrected int for channel C (uint16)
	* 2 bytes: average corrected int for channel G (uint16)
	* 2 bytes: average corrected int for channel T (uint16)
	* 2 bytes: average corrected int for called clusters for base A (uint16)
	* 2 bytes: average corrected int for called clusters for base C (uint16)
	* 2 bytes: average corrected int for called clusters for base G (uint16)
	* 2 bytes: average corrected int for called clusters for base T (uint16)
	* 20 bytes: number of base calls (float) for No Call and channel [A, C, G, T] respectively
	* 4 bytes: signal to noise ratio (float)
	*
	* Record map: (BinUtils.UINT16 * 12 + BinUtils.UINT32 * 5 + BinUtils.FLOAT32 * 1)
	**/

	function getCorrectedIntMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing CorrectedIntMetrics" + '\n');
		//dump("File version: " + version + ' ');
		//dump("Record length: " + recLen + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			//read all bytes for this record
			var rec = {};
			rec.itype = 'corrected_intensity_metric';
			var u = new Uint8Array(bStream.readByteArray(recLen));
			var tmp = new Uint16Array(u.buffer,0,12);
			rec.lane  = tmp[0];
			rec.tile  = tmp[1];
			rec.cycle = tmp[2];
			rec.avint = tmp[3];
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Cycle " + rec.cycle + ' ');
			//dump("AvInt " + rec.avint + '\n');
			rec.ciA  = tmp[4];
			rec.ciC  = tmp[5];
			rec.ciG  = tmp[6];
			rec.ciT  = tmp[7];
			//dump("ciA " +  rec.ciA + ' ');
			//dump("ciC " +  rec.ciC + ' ');
			//dump("ciG " +  rec.ciG + ' ');
			//dump("ciT " +  rec.ciT + '\n');
			rec.ciccA  = tmp[8];
			rec.ciccC  = tmp[9];
			rec.ciccG  = tmp[10];
			rec.ciccT  = tmp[11];
			//dump("ciccA " +  rec.ciccA + ' ');
			//dump("ciccC " +  rec.ciccC + ' ');
			//dump("ciccG " +  rec.ciccG + ' ');
			//dump("ciccT " +  rec.ciccT + '\n');
			// The format says base call counts should be floats but that makes
			// no sense so extract as uint32
			tmp = new Uint32Array(u.buffer,24,5);
			rec.numNcalls = tmp[0];
			rec.numAcalls = tmp[1];
			rec.numCcalls = tmp[2];
			rec.numGcalls = tmp[3];
			rec.numTcalls = tmp[4];
			//if(rec.numNcalls >=10000){
				//dump("callsN " +  rec.numNcalls + ' ');
				//dump("callsA " +  rec.numAcalls + ' ');
				//dump("callsC " +  rec.numCcalls + ' ');
				//dump("callsG " +  rec.numGcalls + ' ');
				//dump("callsT " +  rec.numTcalls + '\n');
			//}
			tmp = new Float32Array(u.buffer,44,1);
			rec.s2n = tmp[0];
			//dump("s2n " +  rec.s2n + '\n');
			data.push(rec);
			bytesAvailable -= recLen;
		}
		return data;
	}


    /**
    * Function to read ErrorMetricsOut.bin Interop file
	* Contains cycle error rate as well as counts for perfect reads and read with 1-4 errors
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (3)
	* byte 1: length of each record
	* bytes (N * 30 + 2) - (N *30 + 11):
	* record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: cycle number (uint16)
	* 4 bytes: error rate (float)
	* 4 bytes: number of perfect reads (uint32)
	* 4 bytes: number of reads with 1 error (uint32)
	* 4 bytes: number of reads with 2 errors (uint32)
	* 4 bytes: number of reads with 3 errors (uint32)
	* 4 bytes: number of reads with 4 errors (uint32)
	* Where N is the record index
	*
	* Record map: (BinUtils.UINT16 * 3 + BinUtils.UINT32 * 6)
	**/
	function getErrorMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing ErrorMetrics" + '\n');
		//dump("File version: " + version + ' ');
		//dump("Record length: " + recLen + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'error_metric';
			var u = new Uint8Array(bStream.readByteArray(6));
			var tmp = new Uint16Array(u.buffer,0,3);
			rec.lane   = tmp[0];
			rec.tile   = tmp[1];
			rec.cycle  = tmp[2];
			rec.errorRate = BinUtils.readFloat32(bStream);
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Cycle " + rec.cycle + '\n');
			//dump("errorRate " + rec.errorRate + '\n');
			u = new Uint8Array(bStream.readByteArray(20));
			tmp = new Uint32Array(u.buffer,0,5);
			rec.r0 = tmp[0];
			rec.r1 = tmp[1];
			rec.r2 = tmp[2];
			rec.r3 = tmp[3];
			rec.r4 = tmp[4];
			//dump("r0 " + rec.r0 + '\n');
			//dump("r1 " + rec.r1 + '\n');
			//dump("r2 " + rec.r2 + '\n');
			//dump("r3 " + rec.r3 + '\n');
			//dump("r4 " + rec.r4 + '\n');
			bytesAvailable -= (BinUtils.UINT16 * 3 + BinUtils.UINT32 * 6);
			data.push(rec);
		}
		return data;
	}


    /**
    * Function to read ExtractionMetricsOut.bin Interop file
	* Contains extraction metrics such as fwhm scores and raw intensities
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (2)
	* byte 1: length of each record
	* bytes (N * 38 + 2) - (N *38 + 39):
	* record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: cycle number (uint16)
	* 4 x 4 bytes: fwhm scores (float) for channel [A, C, G, T] respectively
	* 2 x 4 bytes: intensities (uint16) for channel [A, C, G, T] respectively TODO: Should this line be 4 x 2 bytes?
	* 8 bytes: date/time of CIF creation
	* Where N is the record index
	*
	* Record map: (BinUtils.UINT16 * 7 + BinUtils.UINT32 * 4 + 8)
	**/
	function getExtractionMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing ExtractionMetrics" + '\n');
		//dump("File version: " + version + ' ');
		//dump("Record length: " + recLen + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'extraction_metric';
			var u = new Uint8Array(bStream.readByteArray(6));
			var tmp = new Uint16Array(u.buffer,0,3);
			rec.lane   = tmp[0];
			rec.tile   = tmp[1];
			rec.cycle  = tmp[2];
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Cycle " + rec.cycle + '\n');
			var u = new Uint8Array(bStream.readByteArray(16));
			var tmp = new Float32Array(u.buffer,0,4);
			rec.fwhmA = tmp[0];
			rec.fwhmC = tmp[1];
			rec.fwhmG = tmp[2];
			rec.fwhmT = tmp[3];
			//dump("fwhmA " + rec.fwhmA + ' ');
			//dump("fwhmC " + rec.fwhmC + ' ');
			//dump("fwhmG " + rec.fwhmG + ' ');
			//dump("fwhmT " + rec.fwhmT + '\n');
			u = new Uint8Array(bStream.readByteArray(8));
			tmp = new Uint16Array(u.buffer,0,4);
			rec.intA = tmp[0];
			rec.intC = tmp[1];
			rec.intG = tmp[2];
			rec.intT = tmp[3];
			//dump("intA " + rec.intA + ' ');
			//dump("intC " + rec.intC + ' ');
			//dump("intG " + rec.intG + ' ');
			//dump("intT " + rec.intT + ' ');
			rec.cifDate = BinUtils.readHexString(bStream,8);
			//dump("CIF date " + rec.cifDate + '\n');
			data.push(rec);
			bytesAvailable -= (BinUtils.UINT16 * 7 + BinUtils.UINT32 * 4 + 8);
		}
		return data;
	}


    /**
    * Function to read QualityMetricsOut.bin Interop file
	* Contains quality score distribution
    *
    * @param nsIBinaryInputStream stream
    *        The input stream to read from
    *
    * @return Array of record objects (see format below)
	*
	* Format:
	* byte 0: file version number (4)
	* byte 1: length of each record
	* bytes (N * 206 + 2) - (N *206 + 207):
	* record:
	* 2 bytes: lane number (uint16)
	* 2 bytes: tile number (uint16)
	* 2 bytes: cycle number (uint16)
	* 4 x 50 bytes: number of clusters assigned score (uint32) Q1 through Q50
	* Where N is the record index
	**/
	function getQualityMetrics (bStream){
		var tmp = BinUtils.readUint8(bStream,2);
		var version = tmp[0];
		var recLen  = tmp[1];
		dump("Parsing QualityMetrics" + '\n');
		//dump("File version: " + version + ' ');
		//dump("Record length: " + recLen + '\n');
		var data = [];
		var bytesAvailable = bStream.available();
		while ( bytesAvailable > 0 ){
			var rec = {};
			rec.itype = 'quality_metric';
			u = new Uint8Array(bStream.readByteArray(6));
			tmp = new Uint16Array(u.buffer,0,3);
			rec.lane   = tmp[0];
			rec.tile   = tmp[1];
			rec.cycle  = tmp[2];
			var tinfo = decodeTileId(tmp[1]);
			rec.surface = tinfo[0];
			rec.swath   = tinfo[1];
			rec.image   = tinfo[2];
			//dump("Lane " +  rec.lane + ' ');
			//dump("Tile " +  rec.tile + ' ');
			//dump("Cycle " + rec.cycle + '\n');
			var  i=0, q=1;
			var b = bStream.readByteArray(BinUtils.UINT32*50)
			var qual = [];
			while (i < b.length){
				qual[q] = ((b[i+3] << 24) | (b[i+2] << 16) | (b[i+1] << 8) | (b[i]));
				//dump("\tQ" + q + ':' + qual[q] + ' ');
				i+=4;
				q++;
			}
			//dump('\n');
			rec.qscore = qual;
			data.push(rec);
			bytesAvailable -= (BinUtils.UINT16 * 3 + BinUtils.UINT32 * 50);
		}
		return data;
	}


    /**
    * Function to break down a tile ID to yield surface,swath,image
    *
    * @param String id
    *        The input id to decode e.g. 2301
    *
    * @return Array of int [surface,swath,image]
	*
	**/
	function decodeTileId (id){
		var tmp = [3];
		//dump("Id "      +  id     + ' ');
		tmp[0] = Math.floor(id/1000);
		id -= (1000*tmp[0]);
		tmp[1] = Math.floor(id/100);
		id -= (100*tmp[1]);
		tmp[2] = id;
		//dump("Surface " +  tmp[0] + ' ');
		//dump("Swath "   +  tmp[1] + ' ');
		//dump("Image "   +  tmp[2] + '\n');
		return tmp;
	}
