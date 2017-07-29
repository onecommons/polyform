import type {Adapter} from 'polyform';
import express from 'express';
import type {Middleware, $Application} from 'express';

export class ExpressAdapter implements Adapter {
  routes: Middleware[];
  app: $Application;

  constructor(app: ?$Application) {
    this.app = app || express();
    this.routes = [];
  }

  // adapter should register globals, types, and type handlers
  addToRuntime(runtime: HostRuntime): void {
    runtime.registerType('registerMiddleware', (reify: Middleware), this);
    runtime.registerGlobal('app', this.app);
  }

  // adapt the export object as needed by the current host
  adapt(exportType: string, obj: mixed, name: ?string): mixed {
    this.routes.push(obj);
    return obj;
  }

  // install exported object now
  installExports(currentRuntime: HostRuntime): void {
    for (const route of this.routes) {
      this.app.use(route);
    }
  }
}
