/**
 * tracker.js - Implements a javascript location tracker, plotting the data on
 *              a Google Map.
 *
 * This script features a single 'tracked object' which is something we're
 * interested in tracking.  Its location is retrieved from a server and it's
 * marked with a normal Google Maps pin.
 *
 * There are also any number of 'spotters', which are other points retrieved
 * from the server.  These will be plotted with a range of differently coloured
 * dots.
 *
 * If the user's browser supports it, their location will be retrieved and sent
 * to the server as a spotter location.
 *
 * The locations of the tracked object and all spotters are polled at a
 * regular interval.  There are also controls to allow the user to toggle
 * between having the map follow the tracked object, or their location.
 *
 * Gareth Allan.
 */

/** The location of Leeds (as found by putting Leeds into Google Maps) */
var leeds = new google.maps.LatLng(53.799639,-1.549122);

/** The position of the object being tracked */
var trackedLoc = leeds;

/** The pin that represents the object being tracked. */
var trackedMarker;

/** The path showing the past locations of the object being tracked. */
var trackedPath; 

/** The user's location */
var myLoc = { latitude: leeds.lat(), longitude: leeds.lng() };

/** The marker that represents the user */
var myMarker;

/** The user's name */
var myName = "";

/** The map! */
var map;

/** An array to store the trackers' markers in */
var trackerMarkers = new Array();

/* A flag to indicate whether we have a location from the user's browser */
var gotUserLocation = false;

function initialize()
{
  // Setup the map options
  var mapOptions = {
    zoom: 10,
    center: trackedLoc,
    scaleControl: true,
    mapTypeId: google.maps.MapTypeId.HYBRID
  };

  // Our actual Map
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

  // User's position marker
  myMarker = new google.maps.Marker({
    position: latLngFromCoords(myLoc),
    map: map,
    title:"Your location",
    icon: "me.png"
  });

  // The marker for object being tracked.
  trackedMarker = new google.maps.Marker({
    position: trackedLoc ,
    map: map,
    title:"Balloon's location"
  });

  // Create the containers to hold our custom controls.
  var controlsContainer = dojo.create("div", {
                                        id: "customControls",
                                        className: "customContainer"
                                      });

  var trackingControlsContainer = dojo.create("div", {
                                        id: "trackingControls",
                                        className: "trackContainer"
                                      }, controlsContainer);

  // Add some buttons to the container.
  var locTrackButton = dojo.create("div", { id: "locTrackButton",
                                            innerHTML: "Me",
                                            className: "trackButton trackButtonLeft",
                                            title: "Track my location" },
                                   trackingControlsContainer);
  google.maps.event.addDomListener(locTrackButton, 'click', function() {
    followTracked = false;
    dojo.removeClass("balloonTrackButton", "trackButtonHighlighted");

    followUser = !followUser;
    if (followUser) {
      dojo.addClass("locTrackButton", "trackButtonHighlighted");
      map.setCenter(latLngFromCoords(myLoc));
    } else {
      dojo.removeClass("locTrackButton", "trackButtonHighlighted");
    }
  });

  var balloonTrackButton = dojo.create("div", { id: "balloonTrackButton",
                             innerHTML: "Balloon",
                             className: "trackButton trackButtonRight trackButtonHighlighted",
                             title: "Track balloon's location"},
                             trackingControlsContainer);
  google.maps.event.addDomListener(balloonTrackButton, 'click', function() {
    followUser = false;
    dojo.removeClass("locTrackButton", "trackButtonHighlighted");

    followTracked = !followTracked;
    if (followTracked) {
      dojo.addClass("balloonTrackButton", "trackButtonHighlighted");
      map.setCenter(trackedLoc);
    } else {
      dojo.removeClass("balloonTrackButton", "trackButtonHighlighted");
    }
  });

  // Add a textbox, to allow the user to give their name (so it can be shown
  // to other users).
  var usernameBox = dojo.create("input", {
                id: "userNameBox",
                type: "text",
                size: 10,
                maxlength: 255,
                className: "userNameBox",
                onclick: function() {
                  dojo.attr("userNameBox", "value", "");
                  myName = "";
                },
                onchange: function() {
                  myName = dojo.attr("userNameBox", "value");
                }
              }); /*, controlsContainer);*/

  // Add our custom controls to the map.
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(trackingControlsContainer);
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(usernameBox);

  // Set up W3C Geolocation.  This will update whenever the user's
  // location changes.
  if(navigator.geolocation)
  {
    navigator.geolocation.watchPosition(function(position) {
      handleGeolocationUpdate(position);
    }, function() {
      handleNoGeolocation();
    }, {enableHighAccuracy: true});
  }
  else {
    // TODO: Do we want to notify the user that they can't do geoLocation?
  }

  // Poll positions.
  dojo.ready(startPolling());
}

/**
 * This function is called each time the user's location is updated
 * by the browser.
 *
 * position - the user's position.
 * mapToUpdate - The google.maps.Map object to update.
 * centerMap - Whether to center the map on the user's position.
 * markerToUpdate - The user position marker to be updated.
 */
function handleGeolocationUpdate(position)
{
  // Set the flag to say we have a location
  gotUserLocation = true;

  // Set our location to the newly updated one.
  if (position != undefined && position.coords != undefined) {
    myLoc = position.coords;
  }

  // Add the location marker to the map at our position.
  // TODO: Draw accuracy circle around it (Needs to be translucent red).
  myMarker.setPosition(latLngFromCoords(myLoc));
  myMarker.setVisible(true);

  // Center the map on our location.
  if (followUser) map.setCenter(geoLoc);
}

/**
 * Send the user's location to the server.  If the user hasn't entered a
 * username in the textbox provided, no location will be sent.
 */
function sendMyLocation()
{
  // Send user's location to the server (if the user's entered a username).
  if (myName != "" && gotUserLocation)
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

    dojo.xhrPost({
      url: locationURL + "/" + myName,
      postData: dojo.toJson(locToSend),
      handleAs: "json",
      headers: { "Content-Type": "application/json" },
    });
  }

  // Send our location again after the configured interval.
  setTimeout("sendMyLocation()", (locationSendInterval * 1000));
}

/**
 * Handle a failure to update the user's location.
 */
function handleNoGeolocation()
{
  // Set the flag saying we have the user's location to false
  gotUserLocation = false;

  // Remove user's location marker.
  myMarker.setVisible(false);

  // TODO: Decide what we want to do here, notification-wise.
}

/**
 *  Start the polls for the tracked object and trackers' positions, and the
 *  regular updates of our location to the server.
 */
function startPolling()
{
  // Poll the tracked object's position and the trackers positions.
  pollTrackedPosition();
  pollTrackersPositions();

  // Send user's location to the server.
  sendMyLocation();
}

/*
 * Repeatedly poll the tracked object's position.
 */
function pollTrackedPosition()
{
  // Get the tracked object's position
  dojo.xhrGet({
    url: trackedURL,
    handleAs: "json",
    headers: { "Content-Type": "application/json" },
    load: function(result) {
      updateTrackedPosition(result);
    },
    error: function(errorMessage) {
      //alert("Couldn't get tracked object's position!  " + errorMessage);
    },
    handle: function() {
      // After we've either failed or succeeded, schedule another poll.
      setTimeout("pollTrackedPosition()", (trackedPollInterval * 1000));
    }
  });
}

/*
 * Repeatedly poll the positions of the trackers.
 */
function pollTrackersPositions()
{
  // Get the tracked object's position
  dojo.xhrGet({
    url: trackersURL,
    handleAs: "json",
    headers: { "Content-Type": "application/json" },
    load: function(result) {
      updateTrackersPositions(result);
    },
    error: function(errorMessage) {
      //alert("Couldn't get positions of trackers!  " + errorMessage);
    },
    handle: function() {
      // After we've either failed or succeeded, schedule another poll.
      setTimeout("pollTrackersPositions()", (trackersPollInterval * 1000));
    }
  });
}

/**
 *  Update the position of the tracked object on the map.
 */
function updateTrackedPosition(result)
{
  // TODO: Handle invalid results! (null result, invalid format, etc.)

  // Get tracked object's positions, and draw them as a line.
  // Get & sort the indices of the returned capsule location points.
  var indices = new Array();
  for (var i in result) {
    indices.push(i);
  }
  indices = indices.sort(function(a, b){ return a - b; });

  // Now, go through the location points in order and add them to our array
  // of line points.
  var lineCoords = new Array();
  for (var i in indices)
  {
    var posObj = dojo.fromJson(result[indices[i]]);
    if (posObj.lat != undefined && posObj.long != undefined) {
      var pos = new google.maps.LatLng(posObj.lat, posObj.long);
      lineCoords.push(pos);
    }
  }

  // Clear the old line, set its points to our newly retrieved co-ords and draw it again.
  if (trackedPath != undefined) trackedPath.setMap();
  trackedPath = new google.maps.Polyline({
    path: lineCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 1.0,
    strokeWeight: 2
  });
  trackedPath.setMap(map);

  // Store the last position as the current tracked object position.
  trackedLoc = lineCoords[lineCoords.length - 1];

  // Set the tracked object position.
  trackedMarker.setPosition(trackedLoc);
  trackedMarker.setVisible(true);

  // Center the map on the tracked object, if desired.
  if (followTracked) map.setCenter(trackedLoc);
}

/**
 *  Update the position of all trackers on the map.
 */
function updateTrackersPositions(result)
{
  // TODO: Handle invalid results!

  // Remove all current tracker markers, then clear the list of them.
  // TODO: Be more efficient?  i.e. don't remove a marker if we'll just be putting it back.
  for (var i in trackerMarkers)
  {
    trackerMarkers[i].setVisible(false);
  }

  // Plot each tracker on the map.
  var trackerIconIndex = 0;
  trackerMarkers = new Array();
  for (var tracker in result)
  {
    // Don't plot ourselves on the map - the geolocation stuff'll handle that.
    if (tracker.toLowerCase() == myName.toLowerCase()) continue;

    // Convert the JSON string to an object.
    var tObj = dojo.fromJson(result[tracker]);

    // Create a lat-long object.
    var tLoc = new google.maps.LatLng(tObj.lat, tObj.long); 

    // Work out which icon to use.
    var iconName = trackerIcons[trackerIconIndex];
    if (trackerIconIndex == (trackerIcons.length - 1)) trackerIconIndex = 0;
    else trackerIconIndex++;

    // Create a marker for tracker, add it to the map and store a reference to it.
    var tMarker = new google.maps.Marker({
      position: tLoc,
      map: map,
      title: tracker,
      icon: iconName
    });
    trackerMarkers.push(tMarker);
  }
}

/**
 * A utility method that converts coords (of the Geolocation API's Coordinates
 * format - http://dev.w3.org/geo/api/spec-source.html#coordinates_interface)
 * to a google.maps.LatLng object (See:
 * http://code.google.com/apis/maps/documentation/javascript/reference.html#LatLng)
 */
function latLngFromCoords(coords)
{
  return new google.maps.LatLng(coords.latitude, coords.longitude);
}
