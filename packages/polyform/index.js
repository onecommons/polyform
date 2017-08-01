// we want to be support both transpiled and not transpiled
var resolve = require('resolve');

function getPath(id) {
  return resolve.sync(id, {basedir: __dirname});
}

function load() {
  // we don't want the application and every cube to have install the babel presets
  // so we have to make presets and plugins absolute paths and disable loading .babelrc
  require('babel-register')({
    babelrc: false,
    presets: [getPath("babel-preset-latest"), getPath("babel-preset-react")]
  });
  module.exports = require('./main.js');
}
if (typeof process !== 'undefined' && process.env.POLYFORM_DEV) {
  // only needed when developing polyform package itself
  // when developing your own app the babel adapter will call require('babel/register')
  load();
} else {
  try {
    module.exports = require('./lib/main.js'); // transpiled
  } catch (e) {
    if (e.code = 'MODULE_NOT_FOUND') {
      load();
    } else {
      throw e;
    }
  }
}
