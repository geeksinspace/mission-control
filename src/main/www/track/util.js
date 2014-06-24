/**
 * util.js - Contains utility functions for the entire tracker project.
 *
 * Gareth Allan.
 */

/**
 * Write the given message to the given element.
 *
 * element - the element (or ID of the element) to be written to.
 * message - The text to be written to the element. 
 */
function writeToElement(element, message)
{
  var element = dojo.byId(element);
  if (element) element.innerHTML = message;
}
