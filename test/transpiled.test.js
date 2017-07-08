//@flow
import assert from 'assert';
import type {Adapter, HostRuntime, CrossReference} from '../lib/main';
import {ComponentLoader, HostEnvironment} from '../lib/main';

class TestAdapter {

  types: string[]
  globals: Object
  installed: Array<any>

  constructor(config) {
    Object.assign(this, config);
    this.installed = [];
  }

  installExports(): void {

  }

  addToRuntime(runtime: HostRuntime): void {
    this.types.forEach(t => runtime.addInstallType(t, this));
    runtime.updateGlobals(this.globals);
  }

  adapt(currentRuntime: HostRuntime, name: string, exportType: string, obj: ?any): ?any {
    const wrapped = {wrapped:obj}
    this.installed.push(wrapped);
    return wrapped;
  }

  getCrossReference(currentRuntime: HostRuntime, name: string, componentPath: ?string): ?CrossReference {
    if (componentPath) {
      return null;
    } else {
      const xref = this.globals[name];
      if (xref !== undefined) {
        return {value: xref};
      } else {
        return null;
      }
    }
  }
}

function load(adapter, hostname = 'webapp', component = './fixtures/component') {
  const loader = new ComponentLoader([new HostEnvironment(hostname, [adapter])]);
  loader.loadComponent(component, {}, module);
}

describe('loading components', () => {
  it('should adapt exports', () => {
    const var1 = 'var1';
    const adapter = new TestAdapter({
      types: ["type1", "type2"],
      globals: {var1}
    });
    load(adapter);
    expect( adapter.installed[0].wrapped).toBe ( var1 );
  });

  it('should fail if missing type in environment', () => {
    const adapter = new TestAdapter({
      types: [],
      globals: {}
    });
    //console.log( require.cache)
    expect(()=>load(adapter) ).toThrowError(/type not found in host environment/);
  });

  it('should fail if xref refers to unknown environment', () => {
    //XXX need a different component with a different entryPoint
    const var1 = 'var1';
    const adapter = new TestAdapter({
      types: ["type1", "type2"],
      globals: {var1}
    });
    expect(()=>load(adapter, 'test') ).toThrowError(/host not defined/);
  });

});
