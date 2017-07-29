// @flow
import ExtendableError from 'es6-error';
import path from 'path';
import _ from 'lodash';

export interface PolyCube {
  __cube: string;
};

// one adapter instance per host, reuse if host is run more than once
// hosts and adapters instantiated up front
export interface Adapter {
  // adapter should register globals, types, and type handlers
  addToRuntime(runtime: HostRuntime): void;

  // adapt the export object as needed by the current host
  adapt(exportType: string, obj: any, name: ?string): any;

  // install exported object now
  installExports(currentRuntime: HostRuntime): void;
};

export interface BuildTimeAdapter extends Adapter {
  build(root: string): void;
}

export class CubeInstallError extends ExtendableError {
  constructor(message: string, code: ?string) {
    super(message);
    this.code = code;
  }
}

export class HostEnvironment {
  name: string;
  adapters: Adapter[];
  components: string[];

  constructor(name: string, adapters: Adapter[], components: string[] = []) {
    this.name = name;
    this.adapters = adapters;
    this.components = components;
  }
}

export class HostRuntime {
  host:    HostEnvironment;
  // $FlowFixMe ignore error because there's no implementation of Adapter
  types:   Map<string, Adapter>;
  globals: Object;
  cubes:  Map<string, PolyCube>;

  constructor(host: HostEnvironment) {
    this.host = host;
    this.globals = {};
    this.types = new Map();
    host.adapters.forEach(a => a.addToRuntime(this));
    this.cubes = new Map();
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

/*
  loadTypes(moduleFileName: string): Object {
    // XXX replace with generated file at build time
    // we don't need to load interfaces at runtime
    const interfacePath = path.join(path.dirname(moduleFileName), 'interfaces');
    const interfaceExports = require(interfacePath);
    // find the RuntimeInstances
    return _.fromPairs(_.toPairs(interfaceExports).filter((k, v) => v instanceof RuntimeInstance.constructor));
  }
*/

  findAdapterForExport(exportType: string): Adapter {
    const adapter = this.types.get(exportType);
    if (!adapter) {
      throw new CubeInstallError(`Export failed, no adapter registered for type "${exportType}"`);
    }
    return adapter;
  }

  instantiate(): void {
    // XXX
  }

  // XXX still want this? 
  updateGlobals(update: ?Object) {
    Object.assign(this.globals, update);
  }

  installAll(): void {
    // XXX need to consider use cases where a component
    // imports another component...
    // should we only install the top level exports and
    //require that component to re-export other component imports?
    this.host.adapters.forEach(a => a.installExports(this));
  }
}

export function addCubeInterface<T: PolyCube>(interfaceModuleName: string, dummy: ?T): (T) => void {
  const polyform: HostRuntime = global.polyform;
  return function(exports: T) {
    if (polyform.cubes.has(interfaceModuleName)) {
      throw 'error';
    }
    polyform.cubes.set(interfaceModuleName, exports);
  };
}

type adaptor<T> = (instance: T, name: ?string) => T;

export function registerAdapterType<T>(key: string, adapterClass: Class<Adapter>, dummy: ?T): adaptor<T> {
  const polyform: HostRuntime = global.polyform;
  if (polyform.types.has(key)) {
    throw new CubeInstallError(`An adapter was already registered for ${key}`);
  }
  const adaptor = function(instance: T, name: ?string): T {
    return polyform.findAdapterForExport(key).adapt(key, instance, name);
  };
  adaptor.N = function(named: {[string]: T}): T {
    return adaptor(...N(named));
  }
  polyform.types.set(key, adaptor);
  return adaptor;
}

function N<T>(named: {[string]: T}): [T, string] {
  const s = Object.entries(named)[0][0];
  return [named[s], s];
}

export function createRuntime(env: HostEnvironment): HostRuntime {
   const currentHostRuntime = new HostRuntime(env);
   global.polyform = currentHostRuntime;
   // add adapters to currentHostRuntime, the process of which adds globals and types
   currentHostRuntime.instantiate();
   //currentHostRuntime and all children objects should be frozen and sealed
   return currentHostRuntime;
}

function loadConfig(envName: string, config: ?Object): HostEnvironment {
  return new HostEnvironment(envName, [], ['polyform-logging'])
}

//returns module.exports
export function loadEnvironment(root: string, envName: string = 'app', config: ?Object): any {
  console.log('loadEnvironment', root, envName, config)
  // try {
    const env = loadConfig(envName, config);
    return createRuntime(env);
  /* }  catch (e) {
    if (e instanceof OutOfDateBuildError) {
      if (useStale) {
        return e.getExports();
      } else {
        return rebuild();
      }
    } else {
      throw e;
    }
  }*/
}

export default function run(root: string, main: string, config: ?Object): any {
  loadEnvironment(root, 'app', config);
  if (main.charAt(0) === '.') {
    return require(path.join(root, main));
  } else {
    return require(main);
  }
}
