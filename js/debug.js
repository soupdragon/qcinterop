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



/**
 * Logs a string or an object to both stderr and the js-console only in the case
 * where the debug.log pref is set to true.
 *
 * @param aArg  either a string to log or an object whose entire set of
 *              properties should be logged.
 */
function LOG(aArg) {
    ASSERT(aArg, "Bad log argument.", false);
    var string;
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
    //dump(string + '\n');
    getConsoleService().logStringMessage(string);
}

/**
 * Dumps a warning to both console and js console.
 *
 * @param aMessage warning message
 */
function WARN(aMessage) {
    dump("Warning: " + aMessage + '\n');
    var scriptError = Cc["@mozilla.org/scripterror;1"]
                                .createInstance(Ci.nsIScriptError);
    scriptError.init(aMessage, null, null, 0, 0,
                     Ci.nsIScriptError.warningFlag,
                     "component javascript");
    getConsoleService().logMessage(scriptError);
}


/**
 * Dumps an error to both console and js console.
 *
 * @param aMessage error message
 */
function ERROR(aMessage) {
    dump("Error: " + aMessage + '\n');
    var scriptError = Cc["@mozilla.org/scripterror;1"]
                                .createInstance(Ci.nsIScriptError);
    scriptError.init(aMessage, null, null, 0, 0,
                     Ci.nsIScriptError.errorFlag,
                     "component javascript");
    getConsoleService().logMessage(scriptError);
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

/**
 * Uses the prompt service to display an error message.
 * This function cannot be migrated into a module file, because it relies on an outer window object.
 *
 * @param aMsg The message to be shown
 */
function showError(aMsg) {
    let window = window || null;
    if (window) {
        let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                                      .getService(Ci.nsIPromptService);
        promptService.alert(window, calGetString("calendar", "genericErrorTitle"), aMsg);
    }
}

