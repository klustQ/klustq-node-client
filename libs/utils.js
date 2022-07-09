const util = require("util");
const InvalidConfigError = require("./errors/InvalidConfigError");
var legalChars = new RegExp('^[a-zA-Z0-9._-]*$');
const allowedTopicLength = 249;

/**
 * Validate each line of the provided config object
 * 
 * @param {string} property 
 * @param {*any} value 
 */
function validateConfig (property, value) {
  if (!legalChars.test(value)) {
    throw new InvalidConfigError([property, value, "is illegal, contains a character other than ASCII alphanumerics, '.', '_' and '-'"].join(' '));
  }
}