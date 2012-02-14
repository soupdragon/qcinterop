


function httpRequest() {
	this.wrappedJSObject = this;
}

httpRequest.prototype = {
	classDescription: 	"S2 HTTP Request Javascript XPCOM Component",
	classID:          	Components.ID("{e236545b-758b-4fb9-a535-f81fb73f3355}"),
	contractID:       	"@sanger.ac.uk/httpRequest;1",
	implementationLanguage: Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT,
    constructor: 		"httpRequest",
    flags: 0,

	QueryInterface: 	XPCOMUtils.generateQI(),

	componentLoadTest: function() { 
		return "S2 HTTP Request component loaded"; 
	},
};

var components = [httpRequest];

const NSGetFactory = XPCOMUtils.generateNSGetFactory(components);

