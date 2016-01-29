var regexMrkStart = /\[mrk:(\w+)]/g;
var regexMrkEnd = /\[\/]/g;
var regexMarkers = /\[mrk:(\w+)](.+?)\[\/]/g; // all markers in post


function findMatches(str, regex){
	var match, matches = [];
	while (match = regex.exec(str))
    matches.push(match);

	return matches;
}

var TEST_STRING_PURE = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo, cum est animi perspiciatis, numquam non rem quos, officia aperiam blanditiis possimus pariatur quisquam architecto soluta ducimus eos temporibus sit voluptatem amet fuga molestiae illum quia. Natus exercitationem porro eaque nostrum cumque cum asperiores, placeat officiis molestias. Odit a fugiat aliquam sequi deleniti omnis minima nam unde nesciunt qui blanditiis optio, iusto saepe repudiandae praesentium aspernatur officiis doloribus voluptates, itaque officia quo! Voluptatum expedita iure excepturi asperiores maiores aut quos. Maiores officia laboriosam id tempore excepturi porro repudiandae a, illum illo nam ipsa ipsum assumenda ullam unde, dolores harum soluta eos?'

// an expample of what could be send to the server
var TEST_STRING_MARKED = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Nemo, cum est animi perspiciatis, numquam non rem quos, officia aperiam blanditiis possimus pariatur quisquam architecto soluta ducimus eos temporibus sit voluptatem amet fuga molestiae illum quia. N[mrk:1452090214003]atus exercitationem porro eaque nostrum cumque cum asperiores, placeat officiis molestias. Odit a fugiat aliquam sequi deleniti omnis minima nam unde nesciunt qui blanditiis optio, iusto saepe repudiandae praesentium[/] aspernatur officiis doloribus voluptates, itaque officia quo! Voluptatum expedita iure excepturi asperiores maiores aut quos. Maiores [mrk:14520erwr003]officia laboriosam id tempore[/] excepturi porro repudiandae a, illum illo nam ipsa ipsum assumenda ullam unde, dolores harum soluta eos?'


// next, the server should temporary get rid of markers to insert break lines separators

function removeMarkers(str){
	str = str.replace(regexMrkStart, '');
	str = str.replace(regexMrkEnd, '');
	return str;
}

// var U_SEPARATOR = '\u02D0';
var U_SEPARATOR = '\u02F8';
var SPLIT_CHARS_NUM = 40;

	// Splitting func for breaking text into lines
	function splitLine(st, n) { // string, chars number
	  var b = '';
	  var s = st;
	  while (s.length > n) {
	      var c = s.substring(0, n);
	      var d = c.lastIndexOf(' ');
	      var e = c.lastIndexOf('\n');
	      if (e != -1) d = e;
	      if (d == -1) d = n;
	      b += c.substring(0, d) + '\n';
	      s = s.substring(d + 1);
	  }
	  return b + s;
	}


// before we replace separators with spans we should place markers back

	// split line at index of the first marker
	// insert start marker, get this marker length, add to total marker length
	// attach the end of the string
	// calculate new place to split line (end marker index + total marker length)
	// insert end marker, total marker length += 3, 
	// calculate new place to split line (next start marker + total marker length), etc.

			// upgrade splice func to make insertions into line at a specific index:
			if (!String.prototype.splice) {
			    /**
			     * {JSDoc}
			     *
			     * The splice() method changes the content of a string by removing a range of
			     * characters and/or adding new characters.
			     *
			     * @this {String}
			     * @param {number} start Index at which to start changing the string.
			     * @param {number} delCount An integer indicating the number of old chars to remove.
			     * @param {string} newSubStr The String that is spliced in.
			     * @return {string} A new string with the spliced substring.
			     */
			    String.prototype.splice = function(start, delCount, newSubStr) {
			        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
			    };
			}

function insertMarkersBack(initialStr, arr_startMarkers, arr_endMarkers) {
	var	totalMarkerLength = 0;
	for (var i = 0; i < arr_startMarkers.length; i++) {
		initialStr = initialStr.splice(totalMarkerLength + arr_startMarkers[i].index, 0, arr_startMarkers[i][0]);
		initialStr = initialStr.splice(totalMarkerLength + arr_endMarkers[i].index, 0, arr_endMarkers[i][0]);
	}
	return initialStr;
}

/* run all this above */

function handlePost(postStr) {

	console.log('I got:---', postStr);
	console.log('char-at-0', postStr.charAt(0));

	// creating arrays for start and end markers
		var arr_startMarkers = findMatches(postStr, regexMrkStart);
		var arr_endMarkers = findMatches(postStr, regexMrkEnd);

	// next, the server should temporary get rid of markers to insert break lines separators
		var nonMarkedStr = removeMarkers(postStr);

	// splitting post into lines SPLIT_CHARS_NUM chars each
		var linedStr = splitLine(nonMarkedStr, SPLIT_CHARS_NUM);

	// inserting unicode separator (should be unique)
		var separatedStr = linedStr.replace(/\n/g, U_SEPARATOR );

	// after we're done with separators we can place markers back
		var nonHTMLpost = insertMarkersBack(separatedStr, arr_startMarkers, arr_endMarkers);
		console.log('nonHTMLpost: ', nonHTMLpost)

	// marking up while checking if break line separators cross any range selected by any marker
	// and add extra spans (for multiple lines marked text)

		var HTMLpostMarked_pre = nonHTMLpost.replace(regexMarkers, function(match, mrkId, mrkTxt){
				/*console.log('Match: ',match, 'P1: ', mrkId, 'P2: ', mrkTxt); */
				return '<span class="opener" data-id="' + mrkId + '">' 
					+ mrkTxt.replace(/\u02F8/g, '</span></span><span class="line"><span class="opener" data-id="' + mrkId + '">') 
					+ '</span>';

		});



	// the last thing is to replace all the remaining separators with spans 
		var HTMLpostMarked = '<span class="line">'
		 +  HTMLpostMarked_pre.replace(/\u02F8/g, '</span><span class="line">') 
		 + '</span>';

	// and finally return our marked text for client
	console.log('I made:---', HTMLpostMarked);
		return HTMLpostMarked;

}
