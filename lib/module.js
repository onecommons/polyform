// derived from https://github.com/nodejs/node/blob/0fb21df6e692bef9f55b9bfa876f3c59dc590332/lib/internal/bootstrap_node.js

// Below you find a minimal module system, which is used to load the node
// core modules found in lib/*.js. All core modules are compiled into the
// node binary, so they can be loaded faster.
import resolve from 'resolve';
import path from 'path';
import vm from 'vm';
import fs from 'fs';

export class ModuleLoader {
  constructor(context, _require) {
    this._cache = {};
    this._context = context;
    this._require = _require;
  }

  makeRequire(dirname) {
    const require = (id) => this.require(id, dirname);
    require.cache = this._cache;
    require.resolve = id => resolve.sync(id, dirname && {basedir: dirname});
    return require;
  }

  loadModule(id, dirname) {
    if (resolve.isCore(id)) {
      // use native require
      const dummyModule = new Module(id);
      dummyModule.exports = module.require(id);
      dummyModule.loaded = true;
      return dummyModule;
    }
    const filepath = resolve.sync(id, dirname && {basedir: dirname});
    if (!filepath) {
      const err = new Error(`Cannot find module '${id}'`, );
      err.code = 'MODULE_NOT_FOUND';
      throw err;
    }
    const cached = this._cache[filepath];
    if (cached && (cached.loaded || cached.loading)) {
      return cached;
    }

    const nativeModule = new Module(filepath);
    this._cache[id] = nativeModule;
    nativeModule.require = this._require || this.makeRequire(path.dirname(filepath));
    nativeModule.compile(this._context);
    return nativeModule;
  }

  require(id, dirname) {
    if (resolve.isCore(id)) {
      // use native require
      return module.require(id);
    }
    return this.loadModule(id, dirname).exports;
  }

}

function Module(id) {
  this.filename = id;
  this.id = id;
  this.exports = {};
  this.loaded = false;
  this.loading = false;
}

Module.wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1];
};

Module.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];

Module.prototype.compile = function(context) {
  const source =  Module.wrap(fs.readFileSync(this.filename, {encoding:'utf8'}));

  this.loading = true;
  try {
    const fn = vm.runInContext(source, context, {
      filename: this.filename,
      lineOffset: 0,
      displayErrors: true
    });

    fn(this.exports, this.require, this, this.filename, path.dirname(this.filename));
    this.loaded = true;
  } finally {
    this.loading = false;
  }
};
