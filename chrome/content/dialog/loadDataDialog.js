

function onLoad(){
}

function onCancel(){
	return true;
}

function onAccept(){
	var param = window.arguments[0];
	param.out={};
	if(document.getElementById('urlname').disabled == false){
		param.out.path = document.getElementById('urlname').value
		param.out.type = 'url';
	} else if(document.getElementById('dirname').disabled == false){
		param.out.path = document.getElementById('dirname').value;
		param.out.type = 'dir';
	}
	return true;
}

function getInterOpDir (){
	if (document.getElementById('dirbrowse').disabled){
		return;
	}
	var path = pickInterOpDir();
	if(path != undefined){
		document.getElementById('dirname').value = path;
	}
}

function pickInterOpDir (){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "Select InteropQC Directory", nsIFilePicker.modeGetFolder);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
		var dir = fp.file;
		return dir.path;
 	}
}

function enableUrlSource(){
	document.getElementById('urlname').disabled=false;
	document.getElementById('dirname').disabled=true;
	document.getElementById('dirbrowse').disabled=true;
	document.getElementById('dirname').focus();
}
function enableDirectorySource(){
	document.getElementById('urlname').disabled=true;
	document.getElementById('dirname').disabled=false;
	document.getElementById('dirbrowse').disabled=false;
	document.getElementById('urlname').focus();
}
