// @flow

//import {registerAdapterType} from 'polyform';
import {addCubeInterface} from 'polyform';
import type {PolyCube} from 'polyform';
import type {Middleware, $Application} from 'express';

export interface ExpressCube extends PolyCube {
  app: $Application,
  registerMiddleware: (m: Middleware) => Middleware
}

export const registerCube = addCubeInterface(__dirname, (null: ?ExpressCube));
