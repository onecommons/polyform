// @flow
import ExtendableError from 'es6-error';
import path from 'path';
import _ from 'lodash';

export interface PolyCube {
  __cube: string;
};

export class CubeInstallError extends ExtendableError {
  constructor(message: string, code: ?string) {
    super(message);
    this.code = code;
  }
}

type onloadCallback = (HostRuntime) => void;

// Environments that support module name mapping (like webpack) don't need this at all
// they just need this module mapped to one with an empty addCubeInterface()
export class HostRuntime {
  cubes:  Map<string, PolyCube>;
  loadModuleName: string;
  loadHooks: onloadCallback[];

  constructor() {
    this.cubes = new Map();
    this.loadHooks = [];
  }

  loadPolyCube(moduleFileName: string): Object {
    const exports = this.cubes.get(moduleFileName);
    if (!exports) {
      // Cube not registered but generate a standard module not found exception
      const err = new Error(`Cannot find module '${moduleFileName}'`);
      // $FlowFixMe
      err.code = 'MODULE_NOT_FOUND';
      throw err;
    }
    return exports;
  }

  install(loadModuleName: string, boostrapModuleName: string): Object {
    global.polyform = this;
    //load whatever we need for loader module work
    //by default this loads the built-in transpiler cube
    if (boostrapModuleName) {
      require(boostrapModuleName);
    }
    //instantiates all the cubes by loading load.js
    const config = require(loadModuleName);
    while (this.loadHooks.length) {
      this.loadHooks.shift()(this);
    }
    return config;
  }

  uninstall(): void {
    if (global.polyform === this) {
      //modules often have state so delete them so cache they are reloaded
      if (require.cache) {
        for (const exports of this.cubes.values()) {
          delete require.cache[exports.__cube];
        }
      }
      delete global.polyform;
    }
  }
 }

export function onLoaded(cb: (HostRuntime) => void) {
  const polyform: HostRuntime = global.polyform;
  polyform.loadHooks.push(cb);
}

export function addCubeInterface<T: PolyCube>(interfaceModuleName: string, dummy: ?T): (T) => void {
  const polyform: HostRuntime = global.polyform;
  return function(exports: T) {
    if (polyform.cubes.has(interfaceModuleName)) {
      throw new CubeInstallError(`Already instantiated interface ${interfaceModuleName}`);
    }
    polyform.cubes.set(interfaceModuleName, exports);
  };
}

function getModuleName(root, name) {
  return name.charAt(0) === '.' ? path.join(root, name) : name
}

export function loadEnvironment(root: string, loadModuleName: string = './load', boostrapModuleName: string = ''): Object {
    const currentHostRuntime = new HostRuntime();
    return currentHostRuntime.install(getModuleName(root, loadModuleName), getModuleName(root, boostrapModuleName));
}

//returns module.exports
export function run(root: string, loadModuleName: string): mixed {
  const env = loadEnvironment(root, loadModuleName);
  const main = (env.config && env.config.main) || './run';
  if (!main) {
    return;
  }
  return require(getModuleName(root, main));
}
