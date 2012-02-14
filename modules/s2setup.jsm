/*-------------------------------------------------------------------
 *  Author: Tony Cox (avc@sanger.ac.uk)
 *  Copyright (c) 2006: Genome Research Ltd.
 * Xulnpg is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 * or see the on-line version at http://www.gnu.org/copyleft/gpl.txt
 *-------------------------------------------------------------------
 * This file is part of the Xulnpg package and was written by
 * 	Tony Cox (Sanger Institute, UK) avc@sanger.ac.uk
 *
 * Description: Provides interface for monitoring data in Illumina pipeline
 *              
 * Exported functions: None
 * HISTORY:
 *-------------------------------------------------------------------
 */

/** The list of javascript files to load into our class namespace **/
/** The order of loading is important to avoid unsatisfied dependencies **/
const scriptLoadOrder = [
		"debug.js",
		"appUtils.js",
	];

/** The list of javascript XPCOM components to load into our class namespace **/
const componentLoadOrder = [
		"httpRequest.js",
	];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

var consoleService = Cc["@mozilla.org/consoleservice;1"]
                    .getService(Components.interfaces.nsIConsoleService);

consoleService.logStringMessage("Loading services...");
Components.utils.import("resource://gre/modules/Services.jsm");

consoleService.logStringMessage("Loading XPCOM utils...");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/** Export the top level namespace for the application **/
EXPORTED_SYMBOLS = ["s2"];

consoleService.logStringMessage("Loading S2 core namespace...");

let s2 = {

	/* Shortcut to the console service */
	getConsoleService: function () {
		return Cc["@mozilla.org/consoleservice;1"]
                     .getService(Ci.nsIConsoleService);
	},

	/* Shortcut to the IO service */
	getIOService: function () {
		return Cc["@mozilla.org/network/io-service;1"]
                     .getService(Ci.nsIIOService);
	},


    /**
     * Loads an array of scripts into the passed scope.
     *
     * @param scriptNames an array of calendar script names
     * @param scope       scope to load into
     * @param dir         relative dir; (defaults to <app>/js)
     */
    loadScripts:  function(scriptNames, scope, dir) {
        let scriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                                     .createInstance(Ci.mozIJSSubScriptLoader);
        let ioService = s2.getIOService();
		let rootDir = __LOCATION__.parent.parent.clone();
        if (!dir) {
             rootDir.append("js");
        } else {
			 rootDir.append(dir); // defaults to "js"
		}
        for each (let script in scriptNames) {
            if (!script) {
                // If the array element is null, then just skip this script.
                continue;
            }
            let scriptFile = rootDir.clone();
            scriptFile.append(script);
            let scriptUrlSpec = ioService.newFileURI(scriptFile).spec;
            try {
                scriptLoader.loadSubScript(scriptUrlSpec, scope);
				dump("Loaded script: " + scriptUrlSpec + " in to scope: " + scope + '\n');
            } catch (exc) {
                Components.utils.reportError(exc + " (" + scriptUrlSpec + ")");
            }
        }
    },

};


s2.loadScripts(scriptLoadOrder, s2, "js");
s2.loadScripts(scriptLoadOrder, Components.utils.getGlobalForObject(s2), "js");
s2.loadScripts(componentLoadOrder, s2, "components");
s2.loadScripts(componentLoadOrder, Components.utils.getGlobalForObject(s2), "components");


