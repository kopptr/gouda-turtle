//overlay.js: functionality of the parser is all in here, in the GTDict object and in the functions below it

//object that responds to events of the Firefox window: load (WOTD), keydown and keyup (hotkey)
var GTDict = {

//when the window loads, it checks whether or not it has been long enough since the last loading to
//display a word of the day
onLoad: function() {

            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefService)
                .getBranch("extensions.gtdict.");
	    var wotdOn = prefs.getBoolPref("WOTDOn");
	    var wotdDuration = prefs.getIntPref("WOTDDuration");

	    /* DEMO ONLY -- IF IT MISFIRES, OPEN ABOUT:CONFIG AND RESET IT*/
        /*
	    try{
		    prefs.getBoolPref("doOnce");
	}
	    catch(err)
	    {
		    readWOTDEntry();
		    prefs.setBoolPref("doOnce", true);
		    return;
		}
        */

	    //wotdDuration is hours betweeen popups
	    var timeSplit = wotdDuration * 3600;

	    if(timeSplit == 0 || (!wotdOn))
	    {
		    return;
	     }

            /* This produces tstamp as the number of seconds
             * since the epoch. don't ask me why
             */
            var tstamp = new Date().getTime()/1000;

	//if the try fails, the tstamp pref has not yet been set
	//so we set it in the catch block
            try
            {
                var old = prefs.getIntPref("tstamp");
                //compare now and then
                if((tstamp - old) >= timeSplit)
                {
                	//reset the pref
                    prefs.setIntPref("tstamp", tstamp);
                    	//read the next WOTD
                    readWOTDEntry();
                }
            }
            catch(err)
            {
                prefs.setIntPref("tstamp", tstamp);
            }
        },

//Responds when user presses a key down
//by checking if the key is shift or control or the hotkey
//if all three are down, definition of the highlighted word is shown
onKeyDown: function(e) {

		//get the ascii interpretation of the keycode
               var code = e.keyCode;

               //17 is ascii for control
               if(code == 17)
                   this.ctrlPress=true;

               //16 is ascii for shift
               if(code == 16)
                   this.shftPress=true;

               //determine the current value for the hotkey (first letter)
               var prefs = Components
                            .classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.gtdict.");
               var stringpref = prefs.getCharPref("hotkeypref");
               var hotkey = stringpref.charCodeAt(0);

               //if ctrl & shift are down & they've pressed the hotkey, respond!
               if(code == hotkey
                       && this.ctrlPress == true
                       && this.shftPress==true)
                   showDefinition(getHighlightedText(),true);
           },

//Responds when user unpresses a key
//by checking if the key is shift or control or the hotkey
//if any have been released, the associated variable is modified
onKeyUp: function(e) {

             var code = e.keyCode;

             /* when user releases control or shift key,
              * update status of those booleans
              */
             if(code == 17)
                 this.ctrlPress=false;

             if(code == 16)
                 this.shftPress=false;
         }
};

//creates listeners for window events
window.addEventListener("load", function(e) { GTDict.onLoad(); }, true);
window.addEventListener("keydown", function(e) { GTDict.onKeyDown(e); },
        true);
window.addEventListener("keyup", function(e) { GTDict.onKeyUp(e); }, true);

// Returns the text highlighted on the page by the user
getHighlightedText = function()
{
    //var win = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow('navigator:browser');
    //return win.content.getSelection().toString();
	return document.commandDispatcher.focusedWindow.getSelection().toString();
}

// Returns the raw HTML from url
function get_HTML(url)
{
    // Normally we'd check for browser compatibility
    // but this works in FF :-).
    var req = new XMLHttpRequest();

    // Synchronous request, wait till we have it all
    req.open('GET', url, false);
    req.send(null);
    return req.responseText;
}

// Opens the link in a new tab of the current firefox window
function openUrlNewTab(url)
{
    var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
        .getService(Components.interfaces.nsIWindowMediator)
        .getMostRecentWindow('navigator:browser');
	if(getCurrentWord() != null)
	{
	    newTab = win.gBrowser.addTab(url + getCurrentWord());
	    win.focus();
	}
}

// Returns the current_word preference
//
//the pref current_word is used to save what the highlighted word is
//for the calls from normalpopup.xul and wotdpopup.xul
//(because we cannot figure out how to pass arguments from js to xul back to js again
//except by saving it in a preference)
getCurrentWord = function()
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.");
    return prefs.getCharPref("current_word");
}

// Opens the XUL window defined in normalpopup.xul or wotdpopup.xul
//addwotd: if true, we want to add the word to the storage. if false, we don't.
showDefinition = function(word, addwotd)
{
	/* WHAT IF GETHIGHLIGHTEDWORD RETURNS BLANK?? */
//Then the argument word is blank, and this is probably the most appropriate place to catch that, since it calls the popups


    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.");

   //saves the input argument "word" in the preference "current_word" so that it can be
   //accessed by the .xul files called afterwards
   //we couldn't figure out how to pass arguments to xul files, so this is our workaround
   //if the preference does not exist yet, it is created in the catch block
    try
    {
        prefs.getCharPref("current_word");
    }
    catch(err)
    {
        prefs.setCharPref("current_word",word);
    }
    prefs.setCharPref("current_word",word);

    if(addwotd == true)
    {
        window.open("chrome://gtdict/content/normalpopup.xul", "", "chrome");
    }
    else
    {
        window.open("chrome://gtdict/content/wotdpopup.xul", "", "chrome");
    }
}

//Gets the definition of the word argument -- adds the word to the WOTD storage
getDefinition = function(word)
{
    if(word == "")
        return "No word selected. Highlight a word to select it and try again.";

    var wordresource = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.").getCharPref("resourcepref");

	//if you are developing another parser, add your own case here
    switch(wordresource) {
        case 'dictionary':
            [error,text] = dictionary_dot_com_parse(
                    get_HTML('http://m.reference.com/d/search.html?q=' + word)
                    ,3);
                    //if error code of 0 is returned, the word appears in the word resource's data banks
            if( error == 0)
            {
                addWOTDEntry(word);
                return text;
            }
            //if not, the word does not appear in the word resource's data banks
            //the most common case is for plurals: "turtles" does not appear but "turtle" does
            //so we attempt a word lookup on the word argument minus its final letter
            else
            {
                [text, error] = dictionary_dot_com_parse(
                        get_HTML('http://m.reference.com/d/search.html?q='
                            + word.substring(0,word.length-1)));
                if( error == 0)
                {
                    addWOTDEntry(word);
                    return text;
                }
                else return 'An error was encountered. Please check your Internet connection.';
            }

        case 'thesaurus':
            [error,text] =  thesaurus_dot_com_parse(
                    get_HTML('http://m.reference.com/t/search.html?q='
                        + word));
            if(error == 0)
            {
                addWOTDEntry(word);
                return text;
            }
            else
            {
                [error, text] = thesaurus_dot_com_parse(
                        get_HTML('http://m.reference.com/t/search.html?q='
                            + word.substring(0, word.length-1)));
                if(error == 0)
                {
                    addWOTDEntry(word);
                    return text;
                }
                else return 'An error was encountered. Please check your Internet connection.';
            }

        case 'urbandict':
            [error, text] = urbandict_dot_com_parse(
                    get_HTML('http://www.urbandictionary.com/define.php?term='
                        + word));
            if(error == 0)
            {
                addWOTDEntry(word);
                return text;
            }
            else
            {
                [error, text] = urbandict_dot_com_parse(
                        get_HTML('http://www.urbandictionary.com/define.php?term='
                            + word.substring(0, word.length-1)));
                if(error == 0)
                {
                    addWOTDEntry(word);
                    return text;
                }
                else return 'An error was encountered. Please check your Internet connection.';

            }
        default: return "No website chosen";
    }
}

//gets the definition for the WOTD functionality -- doesn't add to WOTD
//TODO make the popup window obviously different -- I vote for no links and maybe just an
//alert window? I kind of liked the original definition window for this purpose.
getWOTDDefinition = function(word)
{

    var wordresource = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.").getCharPref("resourcepref");

	//if you are developing another parser, add your own case here
    switch(wordresource) {
        case 'dictionary':
            [error,text] = dictionary_dot_com_parse(
                    get_HTML('http://m.reference.com/d/search.html?q=' + word)
                    ,3);
                     //if error code of 0 is returned, the word appears in the word resource's data banks
            if( error == 0)
            {
                return text;
            }
             //if not, the word does not appear in the word resource's data banks
            //the most common case is for plurals: "turtles" does not appear but "turtle" does
            //so we attempt a word lookup on the word argument minus its final letter
            else
            {
                [error,text] = dictionary_dot_com_parse(
                        get_HTML('http://m.reference.com/d/search.html?q='
                            + word.substring(0,word.length-1)));
                if(error == 0)
                    return text;
                else return 'An error was encountered. Please check your Internet connection.';
            }
        case 'thesaurus':
            [error, text] = thesaurus_dot_com_parse(
                    get_HTML('http://m.reference.com/t/search.html?q='
                        + word));
            if(error == 0)
                return text;
            else
            {
                [error, text] = thesaurus_dot_com_parse(
                        get_HTML('http://m.reference.com/t/search.html?q='
                            + word.substring(0,word.length-1)));
                if(error == 0)
                    return text;
                else return 'An error was encountered. Please check your Internet connection.';
            }
        case 'urbandict':
            [error,text] = urbandict_dot_com_parse(
                    get_HTML('http://www.urbandictionary.com/define.php?term='
                        + word));
            if( error == 0)
                return text;
            else
            {
                [error,text] = urbandict_dot_com_parse(
                        get_HTML('http://www.urbandictionary.com/define.php?term='
                            + word.substring(0, word.length-1)));
                if(error == 0)
                    return text;
                else return 'An error was encountered. Please check your Internet connection.';
            }
        default: return "No website chosen";
    }
}

//add a new entry to the word storage
//developer's note: the word storage is a preference of the form
//word|word|word|...
//words are added to the rear, so that the most recent word added is the furthest back in the string
addWOTDEntry = function(word)
{
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.");
    //if the preference exists, we add a word to it
    try{
        var wordlist = prefs.getCharPref("WOTD");
        /* if the wordlist exists and is not blank,
         * we put the word in at the end with a delimiter
         */
        if( wordlist != "" )
        {
            wordlist += "|" + word;
            prefs.setCharPref("WOTD",wordlist);
        }
        /* if the wordlist exists and is blank,
         * we put the word in at the beginning without the delimiter
         */
        else
        {
            prefs.setCharPref("WOTD",word);
        }
    }
    /* if the preference does not exist,
     * we create it with the word at the beginning without the delimiter
     */
    catch(err) {
        //window.alert("Setting a char pref for WOTD");
        prefs.setCharPref("WOTD", word);
    }
}

//reads the first word in the storage
//if the storage is empty, it pops up an alert window reminding the user to use the gtdictionary more often
readWOTDEntry = function()
{
    var word = "";
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService)
        .getBranch("extensions.gtdict.");
    try{
        list = prefs.getCharPref("WOTD");
        //if there are any words of the day
        if( list.length != 0 )
        {
            while( list[0] != "|" && list.length > 0)
            {
                word += list[0];
                list = list.substring(1);
            }

            //modify the WOTD preference value by replacing it
            //with the same list, minus the word we just displayed
            if( list.length == 0 )
            {
                prefs.setCharPref("WOTD", "");
            }
            else
            {
                prefs.setCharPref("WOTD", list.substring(1) );
            }

            showDefinition(word, false);
        }
        //else, no words of the day and we advise the user to use
        //the extension
        else
        {
            window.alert("No words to look up today! Look up some words using"
                    + " the Gouda-Turtle Dictionary and"
                    + " you will have a word of the day");
        }
    }
    /* error thrown if the WOTD pref does not exist;
     * we add it to the preferences with the string ""
     */
    catch(err) {
        addWOTDEntry("");
    }
}
