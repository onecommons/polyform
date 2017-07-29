// we want to be support both transpiled and not transpiled
function load() {
  require('babel/register');
  module.exports = require('./main.js');
}
if (typeof process !== 'undefined' && process.env.POLYFORM_DEV) {
  // only needed when developing polyform package itself
  // when developing your own app the babel adapter will call require('babel/register')
  load();
} else {
  try {
    module.exports = require('./dist/main.js'); // transpiled
  } catch (e) {
    if (e.code = 'MODULE_NOT_FOUND') {
      load();
    } else {
      throw e;
    }
  }
}
