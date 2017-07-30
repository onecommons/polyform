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

export class HostEnvironment {
  name: string;
  cubes: string[];

  constructor(name: string, cubes: string[] = []) {
    this.name = name;
    this.cubes = cubes;
  }
}

export class HostRuntime {
  host:   HostEnvironment;
  cubes:  Map<string, PolyCube>;

  constructor(host: HostEnvironment) {
    this.host = host;
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

  instantiate(): void {
    // XXX
  }

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

// function adaptor<T>(instance: T, name: ?string): T {
//   return adapt(instance, name);
// };
// adaptor.N = function<T>(named: {[string]: T}): T {
//   return adaptor(...N(named));
// }
//
// function N<T>(named: {[string]: T}): [T, string] {
//   const s = Object.entries(named)[0][0];
//   return [named[s], s];
// }

export function createRuntime(env: HostEnvironment): HostRuntime {
   const currentHostRuntime = new HostRuntime(env);
   global.polyform = currentHostRuntime;
   // add adapters to currentHostRuntime, the process of which adds globals and types
   currentHostRuntime.instantiate();
   //currentHostRuntime and all children objects should be frozen and sealed
   return currentHostRuntime;
}

function loadConfig(envName: string, config: ?Object): HostEnvironment {
  return new HostEnvironment(envName, ['polyform-logging'])
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
