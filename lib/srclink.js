/*usage:
Create an index.js that looks like the following. If index.js already exists rename it.

  var packageName = 'myPackage'; // the name of this package
  var main = 'dist'; // set to "main" in package.json or what you renamed index.js to
  module.exports = require('srclink')(packageName, main);
*/
var path = require('path');
module.exports = function(packageName, main) {
  const moduleName = main || packageName;
  const srcDir = process.env['pkg_' + packageName];
  if (srcDir) {
    return require(path.join(path.resolve(srDir), moduleName));
  } else {
    return require(path.join('.', moduleName));
  }
}
