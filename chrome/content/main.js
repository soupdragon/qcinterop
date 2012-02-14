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


Components.utils.import("resource://gre/modules/NetUtil.jsm");


// Global holding parsed QC data records
var QCDATA = {};
//const INTEROPFILES = ["CorrectedIntMetrics","ErrorMetrics","ExtractionMetrics","ImageMetrics","QMetrics","TileMetrics"];
const INTEROPFILES = ["QMetrics"];
//const INTEROPFILES = ["CorrectedIntMetrics"];
//const INTEROPFILES = ["TileMetrics"];
//const INTEROPFILES = ["ControlMetrics"];
//const INTEROPFILES = ["ControlMetrics","TileMetrics"];


function getChart(f){
	return document.getElementById(f);
}

// transmit data for an interop file to the HTML display page
function sendDataToDisplay(interOpFileType,idata){
		var m = {
					event:'storeQcData',
					qctype:interOpFileType,
					data:idata
				};
		getChart('chartFrame').contentWindow.postMessage(m,"*");
}
// transmit event message to the HTML display page
function sendEventToDisplay(e){
		var m = {
					event:e,
				};
		getChart('chartFrame').contentWindow.postMessage(m,"*");
}


function openLoadDialog(){
	var param = {in:{path:"path", type:"type"},out:null};
	window.openDialog("chrome://qcinterop/content/dialog/loadDataDialog.xul","Load", "chrome,dialog,modal",param).focus();
	if(!param.out){
		return;
	}
	if(param.out.type != undefined && param.out.path != ""){
		document.getElementById('datapath').value = param.out.path;
		QCDATA['source'] = param.out.type;
		setLoadDataButtonState();
	}
}

function setLoadDataButtonState(){
	if(document.getElementById('datapath').value != ""){
		document.getElementById('loadbutton').disabled = false;
	} else {
		document.getElementById('loadbutton').disabled = true;
	}
}


function dumpQcSummary(){
	var tb = document.getElementById('qcdump');
	tb.value = "";
	var q;
	for (q in QCDATA){
		tb.value = tb.value+ q + "    " + QCDATA[q]['data'].length + '\n' ;
	}
}

function loadData(){
	if(document.getElementById('datapath').value == ""){
		throw("Invalid data path\n");
	}
	var tb = document.getElementById('qcdump');
	tb.value = "";
	switch (QCDATA['source']){
		case "dir":
			go_file();
			break;
		case "url":
			go_url();
			break;
		default:
			LOG("Unrecognised data source type! Assuming it is a local file\n");
			go_file();
	}
}

function go_file(){
	var dirpath = document.getElementById('datapath').value;
	var dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	dir.initWithPath(dirpath);
	var files = {};
	for (var n in INTEROPFILES){
		var fn = INTEROPFILES[n] + "Out.bin";
		var loc = dir.clone();
		loc.append(fn);
		var f = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		f.initWithPath(loc.path);
		files[INTEROPFILES[n]] = {};
		files[INTEROPFILES[n]].file = f;
	}
	parseInterOpFiles(files);
}

function go_url (){
	var baseurl = document.getElementById('datapath').value;
	var files = {};
	for (var n in INTEROPFILES){
		var fn = INTEROPFILES[n] + "Out.bin";
		var u = NetUtil.newURI(baseurl + "/" + fn)
		files[INTEROPFILES[n]] = {};
		files[INTEROPFILES[n]].uri = u;
	}
	parseInterOpFiles(files);
}


function parseInterOpFiles(files){
	QCDATA = {};
	for (name in files){
		if(files[name].file != undefined){
			parseInterOpFile(name,files[name].file);
		} else {
			parseInterOpFile(name,files[name].uri);
		}
	}
}


function pickInterOpDir (){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Select InteropQC Directory", nsIFilePicker.modeGetFolder);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
		var dir = fp.file;
		return dir;
 	}
}
