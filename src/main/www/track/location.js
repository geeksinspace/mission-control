/**
 * location.js - Implements a javascript location uploader.  Intended to be
 *               used to provide data to tracker.js
 *
 * This script gets the user's location from the browser, and when they click
 * the "Send my Location" button (if they've entered their name in the textbox
 * provided) it sends their location to the server configured, at the interval
 * configured.
 *
 * Gareth Allan.
 */

/** The user's location */
var myLoc;

/** The timeout ID for the location sending loop */
var sendingTimeoutId;

/** The watch ID for geolocation */
var locationWatchId;

/**
 * Perform any necessary initialization tasks.
 */
function initialize()
{
  // Initialize geolocation.
  initializeGeoLocation();
}

/**
 * Perform any tasks necessary to initialize geolocation
 */
function initializeGeoLocation()
{
  // Set up W3C Geolocation.  This will update whenever the user's
  // location changes.
  if(navigator.geolocation)
  {
    locationWatchId = navigator.geolocation.watchPosition(function(position) {
      handleGeolocationUpdate(position);
    }, function() {
      handleNoGeolocation(error);
    }, {enableHighAccuracy: true, timeout:30000});
  }
  else
  {
    writeToLocDiv("Geolocation is not supported by your browser");
    dojo.attr("sendButton", "disabled", "true");
  }
}

/**
 * Write the given message to the location display div.
 *
 * message - The text to be written to the div. 
 */
function writeToLocDiv(message)
{
  writeToElement('loc_div', message);
}

/**
 * This function is called each time the user's location is updated
 * by the browser.
 *
 * position - the user's position.
 */
function handleGeolocationUpdate(position)
{
  // Store the newly updated location.
  if (position != undefined && position.coords != undefined) {
    myLoc = position.coords;
  }

  // Write our location to the location display
  if (myLoc != undefined) {
    var displayString = "";
    if (myLoc.latitude != undefined) displayString += "Lat: " + myLoc.latitude + "<br/>";
    if (myLoc.latitude != undefined) displayString += "Lng: " + myLoc.longitude + "<br/>";
    if (myLoc.accuracy != undefined) displayString += "Acc: " + myLoc.accuracy + "<br/>";
    if (myLoc.altitude != undefined) displayString += "Alt: " + myLoc.altitude + "<br/>";
    if (myLoc.altitudeAccuracy != undefined) {
      displayString += "Alt Acc: " + myLoc.altitudeAccuracy + "<br/>";
    }
    if (myLoc.heading != undefined) displayString += "Hdg: " + myLoc.heading + "<br/>";
    if (myLoc.speed != undefined) displayString += "Spd: " + myLoc.speed;
    writeToLocDiv(dojo.trim(displayString));
  } else {
    writeToLocDiv("Invalid position retrieved!");
  }
}

/**
 * Send the user's location to the server.  If the user hasn't entered a
 * username in the textbox provided, no location will be sent.
 */
function sendMyLocation()
{
  // Get the name the user entered in the box
  var myName = dojo.attr("userNameBox", "value");

  // Send user's location to the server (if the user's entered a username).
  if (myName != undefined && myName != "")
  {
    if (myLoc != undefined)
    {
      // We should always get latitude and longitude.  The rest of the data we
      // send if it's available.
      var locToSend = {
        lat: myLoc.latitude,
        long: myLoc.longitude,
      };
      if (myLoc.accuracy != undefined) locToSend.acc = myLoc.accuracy;
      if (myLoc.altitude != undefined) locToSend.alt = myLoc.altitude;
      if (myLoc.altitudeAccuracy != undefined) {
        locToSend.altacc = myLoc.altitudeAccuracy;
      }
      if (myLoc.heading != undefined) locToSend.heading = myLoc.heading;
      if (myLoc.speed != undefined) locToSend.speed = myLoc.speed;

      // Actually send to the server
      dojo.xhrPost({
        url: locationURL + "/" + myName,
        postData: dojo.toJson(locToSend),
        handleAs: "json",
        headers: { "Content-Type": "application/json" },
      });

      // Update the Button.
      var sendButton = dojo.byId('sendButton');
      dojo.attr(sendButton, "value", "Stop Sending");
      sendButton.onclick = function() { stopSending() };

      // Update the status div.
      var statusDiv = dojo.byId('statusDiv');
      statusDiv.innerHTML = 'Sending';
      dojo.removeClass(statusDiv, 'statusNotSending');
      dojo.addClass(statusDiv, 'statusSending');
    }
    else
    {
      writeToLocDiv("Bad location!");
    }

    // Send our location again after the configured interval.
    sendingTimeoutId = setTimeout("sendMyLocation()", (locationSendInterval * 1000));
  }
  else
  {
    alert("No username entered!  Not sending location");
    stopSending();
  }
}

/**
 * Stop sending the user's location to the server.
 */
function stopSending()
{
  // Stop sending the username.
  clearTimeout(sendingTimeoutId);

  // Update the Button.
  var sendButton = dojo.byId('sendButton');
  dojo.attr(sendButton, "value", "Send Location");
  sendButton.onclick = function() { sendMyLocation() };

  // Update the status div.
  var statusDiv = dojo.byId('statusDiv');
  statusDiv.innerHTML = 'Not Sending';
  dojo.removeClass(statusDiv, 'statusSending');
  dojo.addClass(statusDiv, 'statusNotSending');
}

/**
 * Handle a failure to update the user's location.
 */
function handleNoGeolocation(error)
{
  // Clear the stored location
  myLoc = null;

  // Show an error.
  writeToLocDiv("Couldn't get user's position!");

  // Clear the location watch, and start it again.
  navigator.geolocation.clearWatch(locationWatchId);
  initializeGeoLocation();
}
