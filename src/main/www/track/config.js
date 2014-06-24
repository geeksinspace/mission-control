/**
 * config.js - Contains config for the entire tracker project.
 *
 * Gareth Allan.
 */

/***** Map config. *****/

/** Whether to have the map follow the user */
var followUser = false;

/** Whether to have the map follow the tracked object. */
var followTracked= true;


/***** Location sending config. *****/

/** The URL to post our location to. (We append our name to this) */
var locationURL = "/trackers";

/** The interval we should leave between sending location updates */
var locationSendInterval = 30;


/***** Tracked object config. *****/

/** The URL to poll for the tracked object's position. */
var trackedURL = "/capsule";

/** The querystring to append to the tracked object's position, in order to
    get the last position entry */
var lastEntryQs = "?last1";

/** The polling interval for tracked object position (in seconds) */
var trackedPollInterval = 30;


/***** Trackers config. *****/

/** The URL to get the other trackers' locations from. */
var trackersURL = "/trackers";

/** The polling interval for the other trackers' locations (in seconds) */
var trackersPollInterval = 30;

/** The available tracker icons **/
var trackerIcons = [
                     "p1.png",
                     "p2.png",
                     "p3.png",
                     "p4.png",
                     "p5.png"
                   ];
