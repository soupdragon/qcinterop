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



/*
//  Search format:
//  ArraytoSearch.search (String term [, Boolean exact match])
//
//  Note: "ArraytoSearch" is an array variable. String term is what
//  you want to find in that array. Boolean exact match can be set to true
//  or false. If you want to find an exact match, you can omit this argument
//  or send it as false. If you want to find an instance, you can send
//  this argument as true.
*/

/*
Array.prototype.search = function(s,q){
  var len = this.length;
  for(var i=0; i<len; i++){
    if(this[i].constructor == Array){
      if(this[i].search(s,q)){
        return true;
        break;
      }
     } else {
       if(q){
         if(this[i].indexOf(s) != -1){
           return true;
           break;
         }
      } else {
        if(this[i]==s){
          return true;
          break;
        }
      }
    }
  }
  return false;
}
*/


	/**
	 * Purpose:
	 *   What are we running on?
	 */

	function appInfo ()
	{
		var i = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
		var tmp = {};
		tmp.vendor 		= i.vendor;
		tmp.name 		= i.name;
		tmp.id 			= i.ID;
		tmp.version 	= i.version;
		tmp.build 		= i.appBuildID;
		tmp.platformVersion = i.platformVersion;
		return tmp;
	}

	/**
	 * Purpose:
	 *   Clean or forced application exit
	 */
	function appExit (aForceQuit)
	{
	  var appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].getService(Components.interfaces.nsIAppStartup);

	  // eAttemptQuit will try to close each XUL window, but the XUL window can cancel the quit
	  // process if there is unsaved data. eForceQuit will quit no matter what.
	  var quitSeverity = aForceQuit ? Components.interfaces.nsIAppStartup.eForceQuit :
	                                  Components.interfaces.nsIAppStartup.eAttemptQuit;
	  appStartup.quit(quitSeverity);
	}

/* Shortcut to the console service */
function getConsoleService() {
    return Components.classes["@mozilla.org/consoleservice;1"]
                     .getService(Components.interfaces.nsIConsoleService);
}


/**
 * Returns a string describing the current js-stack with filename and line
 * numbers.
 *
 * @param aDepth (optional) The number of frames to include. Defaults to 5.
 * @param aSkip  (optional) Number of frames to skip
 */
function STACK(aDepth, aSkip) {
    let depth = aDepth || 10;
    let skip = aSkip || 0;
    let stack = "";
    let frame = Components.stack.caller;
    for (let i = 1; i <= depth + skip && frame; i++) {
        if (i > skip) {
            stack += i + ": [" + frame.filename + ":" +
                     frame.lineNumber + "] " + frame.name + "\n";
        }
        frame = frame.caller;
    }
    return stack;
}
/**
 * Logs a message and the current js-stack, if aCondition fails
 *
 * @param aCondition  the condition to test for
 * @param aMessage    the message to report in the case the assert fails
 * @param aCritical   if true, throw an error to stop current code execution
 *                    if false, code flow will continue
 *                    may be a result code
 */
function ASSERT(aCondition, aMessage, aCritical) {
    if (aCondition) {
        return;
    }

    let string = "Assert failed: " + aMessage + '\n' + STACK(0, 1);
    if (aCritical) {
        throw new Components.Exception(string,
                                       aCritical === true ? Components.results.NS_ERROR_UNEXPECTED : aCritical);
    } else {
        Components.utils.reportError(string);
    }
}


function consoleDump(str){
		dump(str + "\n");
}


function oDump(object, depth, max){
  depth = depth || 0;
  max = max || 2;

  if (depth > max)
    return false;

  var indent = "";
  for (var i = 0; i < depth; i++)
    indent += "  ";

  var output = "";
  for (var key in object){
    output += "\n" + indent + key + ": ";
    switch (typeof object[key]){
      case "object": output += oDump(object[key], depth + 1, max); break;
      case "function": output += "function"; break;
      default: output += object[key]; break;
    }
  }
  return output;
}


/**
 * Logs a string or an object to both stderr and the js-console only in the case
 * where the calendar.debug.log pref is set to true.
 *
 * @param aArg  either a string to log or an object whose entire set of
 *              properties should be logged.
 */
function LOG(aArg) {
    ASSERT(aArg, "Bad log argument.", false);
    // We should just dump() both String objects, and string primitives.
    if (!(aArg instanceof String) && !(typeof(aArg) == "string")) {
       	var string = "Logging object...\n";
       	for (var prop in aArg) {
       	    string += prop + ': ' + aArg[prop] + '\n';
       	}
       	string += "End object\n";
    } else {
        string = aArg;
    }

    // xxx todo consider using function debug()
    dump(string + '\n');
    getConsoleService().logStringMessage(string);
}
