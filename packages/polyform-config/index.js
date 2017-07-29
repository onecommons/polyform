/*
Requirements:
* different defaults per exec context (e.g. unittests vs. live)
* local overrides that
** don't modify checked-in files
** can be different per exec context
** easy to switch via the command line

Configuration is constructed by merging the following:

1 environment variables
2 overrides passed as arguments
3. local config files along search path
4. default config files along search path

The factory function sets a search path, defaults to [__dirname/..]

Loading a config file on the search path follows these steps:

For each dir on the path, try to load a config:
if NODE_ENV is set, look in that ./NODE_ENV/config
if module doesn't exists or NODE_ENV is not set, look in ./config
*/

var _ = require('underscore');
var defaultsDeep = require('lodash.defaultsdeep');
var path  = require('path');

var startjson = /^(\d|\{|\[|"|null|true|false)/;

// check if the file exists and is not a directory
// if using --preserve-symlinks and isMain is false,
// keep symlinks intact, otherwise resolve to the
// absolute realpath.
function tryFile(requestPath, isMain) {
  const rc = stat(requestPath);
  if (preserveSymlinks && !isMain) {
    return rc === 0 && path.resolve(requestPath);
  }
  return rc === 0 && toRealPath(requestPath);
}

// given a path check a the file exists with any of the set extensions
function tryExtensions(p, exts, isMain) {
  for (var i = 0; i < exts.length; i++) {
    const filename = tryFile(p + exts[i], isMain);

    if (filename) {
      return filename;
    }
  }
  return false;
}


function safeRequire(filename) {
  let extension = path.extname(filename);
  if (!extension) {
    const filepath = tryExtensions(filename, exts);
    if (filepath) {
      filename = filepath;
    }
  }
  if (!path.exists(filepath)) {
    return null;
  }
  switch (extension) {
    case '.js':
      break;
    case '.json':

      break
    case '.yml':
    case '.yaml':
      break;
  }

  try {
    return require(path);
  } catch (err) {
    if (err.code == "MODULE_NOT_FOUND") {
      return null;
    } else {
      throw err;
    }
  }
}

function loaddefaults(basedir, configname) {
  var filepath, defaults = {};
  //put NODE_ENV in the path if it's set
  if (process.env.NODE_ENV) {
    filepath = path.join(basedir, process.env.NODE_ENV, 'config',configname);
    defaults.config = safeRequire(filepath);
  }
  if (!defaults.config) { //no NODE_ENV or file not found
    filepath = path.join(basedir, 'config',configname);
    defaults.config = safeRequire(filepath,configname);
  }
  if (defaults.config) {
    defaults.path = filepath;
  }
  return defaults;
}

/**
@param overrides (optional): dictionary<config name, defaults>
@param paths: (optional) list of paths to search (default: "..")
@param configname: (optional) if not supplied, returns a function
*/
module.exports = function() {
  var args = Array.prototype.slice.call(arguments)
  var overrides;
  if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
    overrides = args.shift();
  } else {
    overrides = global.configOverrides || {};
  }
  var paths;
  if (Array.isArray(args[0])) {
    paths = args.shift();
  } else {
    // note: ".." because this file lives "lib" not the root
    paths = global.configPaths || ['..'+path.sep];
  }
  var configname = args[0];
  var reload = args[1];
  var cache = {};
  var configLoader = function(configname, reload) {
    if (!reload && cache[configname]) //do this for consistency as much as for efficiency
      return cache[configname];
    //get an array of config objects found on the path
    var localConfiginfo = paths.map(function(p) {
      return loaddefaults(p, configname + '.local');
    })
    var defaultConfiginfo = paths.map(function(p) {
      return loaddefaults(p, configname);
    })
    var configinfo = localConfiginfo.concat(defaultConfiginfo);
    var defaultss = _.compact(_.pluck(configinfo, 'config'));
    var sources = _.compact(_.pluck(configinfo, 'path'));

    if (overrides[configname]) {
      defaultss.unshift(overrides[configname])
    }

    var rx = new RegExp('^' + configname.toUpperCase()+'_(.+)');
    var envconfig = {};
    var envKeys = Object.keys(process.env);
    //we want to sort so that more specific keys are applied last
    envKeys.sort();
    _(envKeys).each(function(key) {
      var m = key.match(rx);
      if (m) {
        var current = envconfig;
        var names = m[1].split('__');
        var name = null;
        for (;;) {
          name = names.shift();
          if (names.length) {
            var obj;
            var type = typeof current[name];
            if (type === 'object')
              obj = current[name];
            else if (type !== 'undefined')
              return //XXX log error
            else
              current[name] = obj = {};
            current = obj;
          } else {
            break
          }
        }

        var value = process.env[key];
        if (value.match(startjson)) {
          try {
            value = JSON.parse(value);
          } catch (e) {}; //XXX log error
        }

        current[name] = value
      }
    }); //end each()
    defaultss.unshift(envconfig);

    //merge config array
    var config =  defaultsDeep.apply(defaultsDeep, defaultss);
    config.configSources = sources;
    cache[configname] = config;
    return config;
  };
  configLoader.paths = paths;
  if (configname) {
    return configLoader(configname, reload);
  }
  return configLoader;
}
