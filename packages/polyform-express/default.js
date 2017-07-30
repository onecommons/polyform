// @flow

/* XXX
//runtime:
export const app = global.polyform.globals.app;
//loadtime:
export const registerMiddleware = global.polyform.getTypes('registerMiddleware');
*/

import type {Middleware} from 'express';
import express from 'express';

//import {config} from 'config';
//export const app = config.app || express();

export const app = express();

// import {onLoaded} from 'polyform';
// onLoaded( () => {
//   for (const route of routes) {
//     app.use(route);
//   }
//   routes = null; //can't use anymore
// })

export function registerMiddleware(route: Middleware): Middleware {
  app.use(route);
  return route;
}

export const __cube = __filename;
