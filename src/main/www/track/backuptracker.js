/**
 * backuptracker.js - Implements a simple javascript tracker.  Intended to be
 *                    used as a backup to tracker.js.
 *
 * This script queries the configured server at the configured interval for a
 * location and prints the results.
 *
 * Gareth Allan.
 */

var latSpanId = 'latSpan';
var longSpanId = 'longSpan';
var accSpanId = 'accSpan';
var altSpanId = 'altSpan';
var altAccSpanId = 'altAccSpan';
var hdgSpanId = 'hdgSpan';
var spdSpanId = 'spdSpan';
var errorDivId = 'errorDiv';
var gmapsLinkId = 'gmapsLink';

/*
 * This function is called by dojo.ready().  It starts polling the server
 * for the tracked object's location at the configured interval.
 */
function pollTrackedPosition()
{
  // Get the tracked object's position
  dojo.xhrGet({
    url: trackedURL + lastEntryQs,
    handleAs: "json",
    headers: { "Content-Type": "application/json" },
    load: function(result) {
      displayTrackedPosition(result);
    },
    error: function(errorMessage) {
      showError("Couldn't get tracked object's position!  " + errorMessage);
    },
    handle: function() {
      // After we've either failed or succeeded, schedule another poll.
      setTimeout("pollTrackedPosition()", (trackedPollInterval * 1000));
    }
  });
}

/*
 * Display the position of the tracked object.
 */
function displayTrackedPosition(result)
{
  // Get & sort the indices of the returned capsule location points.
  // We're only expecting to get one point, but this makes us more robust.
  var indices = new Array();
  for (var i in result) indices.push(i);
  indices = indices.sort(function(a, b){ return a - b; });

  // Now, get the latest position and display it.
  if (indices.length > 0)
  {
    var position = result[indices[indices.length-1]]
    if (position != undefined)
    {
      // Write the position details to the page.
      if (position.lat != undefined) writeToElement(latSpanId, position.lat);
      else writeToElement(latSpanId, '');

      if (position.long != undefined) writeToElement(longSpanId, position.long);
      else writeToElement(longSpanId, '');

      if (position.acc != undefined) writeToElement(accSpanId, position.acc);
      else writeToElement(accSpanId, '');

      if (position.alt != undefined) writeToElement(altSpanId, position.alt);
      else writeToElement(altSpanId, '');

      if (position.altAcc != undefined)
        writeToElement(altAccSpanId, position.altAcc);
      else writeToElement(altAccSpanId, '');

      if (position.hdg != undefined) writeToElement(hdgSpanId, position.hdg);
      else writeToElement(hdgSpanId, '');

      if (position.spd != undefined) writeToElement(spdSpanId, position.spd);
      else writeToElement(spdSpanId, '');

      // Write a Google Maps link to the page.
      dojo.attr(gmapsLinkId, 'href', 'http://maps.google.co.uk/?q=' +
                     position.lat + ',' + position.long + '&t=k');
    }
    else showError("Got an invalid position from the server.");
  }
  else showError("Couldn't get a position from the server.");
}
/**
 * Display an error in the error div.  Clears all other position displays.
 */
function showError(message)
{
  writeToElement(latSpanId, '');
  writeToElement(longSpanId, '');
  writeToElement(accSpanId, '');
  writeToElement(altSpanId, '');
  writeToElement(altAccSpanId, '');
  writeToElement(hdgSpanId, '');
  writeToElement(spdSpanId, '');

  writeToElement(errorDivId, message);
}
