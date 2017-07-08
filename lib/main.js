// @flow
// import _ from 'lodash';
import vm from 'vm';
import ExtendableError from 'es6-error';
import assert from 'assert';
import resolve from 'resolve';
import {ModuleLoader} from './module';
import path from 'path';

/*
components and adapters should be separate packages, using peerDependencies: { rebase }
use npm link until on github https://docs.npmjs.com/cli/link
*/

export interface CrossReference {
  value: ?any
}

// one adapter instance per host, reuse if host is run more than once
// hosts and adapters instantiated up front
export interface Adapter {
  // adapter should register globals, types, and type handlers
  addToRuntime(runtime: HostRuntime): void;

  // adapt the export object as needed by the current host
  adapt(currentRuntime: HostRuntime, name: string, exportType: string, obj: ?any): ?any;

  // install exported object now
  installExports(currentRuntime: HostRuntime): void;

  // @param otherRuntime The runtime requesting the variable
  // @param name: the variable
  // @param componentPath: path to component that exports the variable (optional)
  getCrossReference(otherRuntime: HostRuntime, name: string, componentPath: ?string): ?CrossReference;
};

export type ComponentMetadata = {
  name: ?string,
  configDefaults: ?Object,
  configSchema: ?Object,
  entryPoints: Object,
  dirname: ?string
};

export class ComponentInstallError extends ExtendableError {
  constructor(message: string, code: ?string) {
    super(message);
    this.code = code;
  }
}

export class HostEnvironment {
  name: string;
  adapters: Adapter[];

  constructor(name: string, adapters: Adapter[]) {
    this.name = name;
    this.adapters = adapters;
  }
}

export class HostRuntime {
  host:    HostEnvironment;
  types:   Map<string, Adapter>;
  globals: Object;
  componentStack: Object[];
  xrefs:   Map<string, CrossReference>;
  moduleLoader: ?ModuleLoader;

  constructor(host: HostEnvironment) {
    this.host = host;
    this.globals = {};
    this.types = new Map();
    host.adapters.forEach(a => a.addToRuntime(this));
    this.componentStack = [];
    this.xrefs = new Map();
    this.moduleLoader = null;
  }

  addInstallType(type: string, adapter: Adapter) {
    if (this.types.has(type)) {
      throw new ComponentInstallError(`Adapter already registered for ${type}`);
    }
    this.types.set(type, adapter);
  }

  updateGlobals(update: ?Object) {
    Object.assign(this.globals, update);
  }

  pushComponent(dirname: string, filename: string): void {
    const importedTypes = new Set();
    this.componentStack.push({dirname, filename, importedTypes})
  }

  popComponent(dirname: string, filename: string): void {
    const component = this.componentStack.pop();
    assert(component.dirname == dirname)
    assert(component.filename == filename)
  }

  getCurrentComponent(): Object {
    return this.componentStack.slice(-1)[0];
  }

  getCrossReference(host: string, name: string, componentPath: ?string): ?CrossReference {
    return this.xrefs.get(`${host},${name},${componentPath||''}`);
  }

  addCrossReference(host: string, name: string, componentPath: ?string, xref: CrossReference):void  {
    this.xrefs.set(`${host},${name},${componentPath||''}`, xref);
  }

  findAdapterForExport(exportType: string): Adapter {
    // first make sure type was imported by the current component
    if (!this.getCurrentComponent().importedTypes.has(exportType)) {
      throw new ComponentInstallError(`Export failed, type "${exportType}" has not been imported`);
    }
    const adapter = this.types.get(exportType);
    if (!adapter) {
      throw new ComponentInstallError(`Export failed, no adapter registered for type "${exportType}"`);
    }
    return adapter;
  }

  installAll(): void {
    // XXX need to consider use cases where a component imports another component...
    // should we only install the top level exports and require that component to re-export other component imports?
    this.host.adapters.forEach(a => a.installExports(this));
  }
}

/* usage
const cl = new ComponentLoader({adapters})
cl.loadComponent('component')

const app = rebase.instantiate({adapters, components, cwd});
app.app //installed by express adapter
*/
//constructor({environments = [browser, webapp], adapters = []}: {environments: HostEnvironment[], adapters: Adapter[]} = {})

export class ComponentLoader {

  environments: Map<string, HostEnvironment>;
  constructor(environments: HostEnvironment[]) {
    this.environments = new Map(environments.map(e => [e.name, e]));
  }

  getEnvironments(): HostEnvironment[] {
    return Array.from(this.environments.values());
  }

  getEnvironment(name: string): ?HostEnvironment {
    return this.environments.get(name);
  }

  loadComponent(component: string, config: ?Object, callerModule: ?typeof module): void {
    return this.loadComponents([component], config, callerModule);
  }

  // XXX support cross-dependencies by having hosts and components be a queue that is popped
  // and preserve each hosts context and runtime in case the host is running again
  loadComponents(components: string[], config: ?Object, callerModule: ?typeof module): void {
    const relativeModule = callerModule || module;
    const componentMetadata: ComponentMetadata[] = components.map(c => {
      //to support relative paths, load the component from the caller perspective
      const metadata: ComponentMetadata = relativeModule.require(c);
      const filepath = resolve.sync(c, {basedir: path.dirname(relativeModule.filename)});
      metadata.dirname = path.dirname(filepath);
      return metadata;
    });

    // XXX config = loadConfig([config].concat(_(componentMetadata).map('configDefaults'))

    for (const host of this.getEnvironments()) {
      const currentRuntime = new HostRuntime(host);
      const globals = this._getIntrinsics(currentRuntime);
      globals.config = config || {};
      Object.assign(globals, this.getGlobals());
      const context = vm.createContext(globals);
      //use the regular require() for loading regular modules
      currentRuntime.moduleLoader = new ModuleLoader(context, relativeModule.require);
      try {
        componentMetadata.forEach(c => {
          const modulePath = c.entryPoints[host.name];
          if (modulePath) {
            this._loadTranspiledComponent(context, modulePath, c.dirname);
          }
        });
        //retrieve installQueue and install
        currentRuntime.installAll();
      } finally {
        //XXX anything to cleanup?
      }
    }
  }

   _loadTranspiledComponent(context: vm$Context, component: string, dirname: ?string): void {
     // run in sandbox
     const src = `rebase$loadComponent('${component}', '${dirname||''}')`;
     vm.runInContext(src, context);
   }

  getGlobals() {
    return {process, console, Buffer, clearImmediate, clearInterval, clearTimeout, setImmediate, setInterval, setTimeout};
  }

  _getIntrinsics(currentRuntime: HostRuntime): Object {
    return {
      rebase$loadComponent: (id, dirname, ...varNames) => {
        const moduleLoader = currentRuntime.moduleLoader;
        if (!moduleLoader) {
          throw new ComponentInstallError("unexpected error");
        }
        let component = moduleLoader.loadModule(id, dirname);
        let exports = component.exports;
        // component id can point to the metadata (with entryPoints defined) 
        // or directly to a component module
        if (exports && exports.entryPoints) {
          const env = currentRuntime.host.name;
          const entryPoint = exports.entryPoints[env];
          if (!entryPoint) {
            throw new ComponentInstallError(`No entry point for ${env} in '${id}'`, 'MODULE_NOT_FOUND');
          }
          // load relative to component location
          exports = moduleLoader.require(entryPoint, path.dirname(component.filename));
          //XXX if this isn't top a level load and it isn't in the module cache
          // then we need to add the component to queue
          // because we now need to execute on the other hosts
        }
        if (!varNames) {
          return exports;
        } else {
          return varNames.map(name => exports[name]);
        }
      },

      rebase$startComponentLoad: (dirname, filename) => {
        currentRuntime.pushComponent(dirname, filename)
      },

      rebase$endComponentLoad: (dirname, filename) => {
        //XXX module-level cleanup and validation
        currentRuntime.popComponent(dirname, filename)
      },

      rebase$findTypesInEnvironment: (...typeNames: string[]): void => {
        // raise error if not found in this.currentRuntime.types
        for (const variable of typeNames) {
          if (!currentRuntime.types.get(variable)) {
            throw new ComponentInstallError(`type not found in host environment ${variable}`);
          }
          currentRuntime.getCurrentComponent().importedTypes.add(variable);
        }
      },

      rebase$getFromEnvironment: (...varNames): any[] => {
        return varNames.map(name => currentRuntime.globals[name]);
      },

      rebase$getRefAcrossEnvironment: (env, componentPath, ...varNames): any[] => {
        //XXX if component
        // env already run: check if component was loaded, if not requeue env
        // else add component to list of entry points to env
        // ask adapter for req

        return varNames.map(name => this._getCrossReference(currentRuntime, env, name, componentPath));
      },

      rebase$adapt: (exportName, exportType, obj): ?any => {
        const adapter = currentRuntime.findAdapterForExport(exportType);
        const result = adapter.adapt(currentRuntime, exportName, exportType, obj);
        return result;
      },
    }
  }

  _getCrossReference(currentRuntime: HostRuntime, env: string, name: string, componentPath: string) {
    const xref = currentRuntime.getCrossReference(env, name, componentPath);
    if (xref) {
      return xref.value;
    }
    const host = this.getEnvironment(env);
    if (!host) {
      throw new ComponentInstallError(`host not defined: ${env}`);
    } else {
      for (const adapter of host.adapters) {
        const xref = adapter.getCrossReference(currentRuntime, name, componentPath);
        if (xref) {
          currentRuntime.addCrossReference(env, name, componentPath, xref);
          return xref.value;
        }
      }
    }
  }
}
