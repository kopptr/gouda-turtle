//parsers.js: parsers receive raw html from a word resource and return the definitions, synonym list, etc., stored in that html

//Developer's note: If you are developing another parser, put it into this file

// Returns true if the input is indeed a number, else false.
function isNumeric(input) { return (input - 0) == input && input.length > 0;}

/* Given raw HTML from dictionary.com.
 * Returns the first n definitions.
 * If there are less than n definitions,
 * the it returns all of the definitions.
 */
dictionary_dot_com_parse = function(raw, n)
{
    definitions = '';

    /* GET DEFINITIONS
     * Split the file into an array of lines
     */
    lines = raw.split("\n");

    /* The definition occurs on the 19th line
     * of HTML from dictionary.com
     */
    raw = lines[18];

    /* Write stack decrements on <
     * and increments on >, so we
     * are only writing to output
     * if write_stack == 0
     */
    write_stack = 0;
    index = 0;

    /* Luckily they got lazy and threw a
     * bunch of non-breaking spaces
     * at the end :-)
     */
    while(raw[index] != '&' && index < raw.length)
    {
        //Top n definitions only
        if(write_stack == 0 && raw[index] == n+1)
            break;
        else if(raw[index] == '<')
            write_stack--;
        else if(raw[index] == '>')
            write_stack++;
        else if(write_stack == 0)
            definitions += raw[index];
        index++;
    }

    /* CLEAN UP DEFINITIONS TO LOOK PRETTY
     * Remove the "x results for word:word/stuff/"
     */
    index = 0;
    while(definitions[index] != '[' && index < definitions.length)
        ++index;
    definitions = definitions.substring(index);

    // Remove the "[Origin: ..." at the end.
    index = definitions.length - 1;
    while(definitions[index] != '[' && index >= 0)
        --index;
    if(definitions[index+1] == 'O')
        definitions = definitions.substring(0,index);

    // Put a newline between definitions
    index = 0;
    newlines = 0;
    while(newlines < n && index < definitions.length)
    {
        if(isNumeric(definitions[index]) && definitions[index] != ' ')
        {
            definitions = definitions.substring(0,index) +
                '\n\n' + definitions.substring(index, index+2) +
                ' ' + definitions.substring(index+2);
            newlines++;
            index+=3; // Account for the newly inserted characters.
        }
        index++;
    }

    // If definitions is empty, no definition was found.
    if(definitions == '')
        return [1,'No definition found... try another word resource?\n'];

    definitions = getCurrentWord() + ': ' + definitions;
    return [0,definitions];
}

// Given raw HTML from thesaurus.com, returns the info.
thesaurus_dot_com_parse = function(raw)
{
    synonyms = '';

    /* GET SYNONYMS
     * Split the file into an array of lines
     */
    lines = raw.split("\n");


    // Delete the <br...Source.. if it is there.
    if((lines[21])[0] == '<' && (lines[21])[1] == 'b')
        lines[21] = '';

    /* The definition occurs on the 21th line
     * of HTML from thesaurus.com
     */
    raw = lines[20] + '\n' + lines[21];

    /* Write stack decrements on <
     * and increments on >, so we
     * are only writing to output
     * if write_stack == 0
     */
    write_stack = 0;
    index = 0;
    while(index < raw.length)
    {
        if(raw[index] == '<')
            write_stack--;
        else if(raw[index] == '>')
            write_stack++;
        else if(write_stack == 0)
            synonyms += raw[index];
        index++;
    }

    /* If synonyms is empty, no entry was found.
     * If there is a 'v' there, then there is no entry
     */
    if(synonyms == '' || synonyms[1] == 'v')
        return [1,'No synonyms found... try another word resource?\n'];

    synonyms= getCurrentWord() + ': ' + synonyms;
    return [0,synonyms];
}

// Given raw HTML from urbandictionary.com, returns the info.
urbandict_dot_com_parse = function(raw)
{
    definitions = '';

    /* GET DEFINITIONS
     * Split the file into an array of tags
     */
    lines = raw.split("<");

    i = 0;
    while(i < lines.length)
    {
        if(lines[i].length > 23)
            if( lines[i].substring(0,23) == 'div class="definition">' )
            {
                definitions += lines[i].substring(23) + '\n';
                definitions = getCurrentWord() + ': ' + definitions;
                return [0, definitions];
            }
        ++i;
    }
    return [1,'No synonyms found... try another word resource?\n'];
}
