//public interface exported by Adapter
//runtime:
export const app = global.polyform.globals.app;
//loadtime:
export const registerMiddleware = global.polyform.getTypes('registerMiddleware');

import {registerAdapterType} from 'polyform';
import type {Middleware} from 'express';
import {ExpressAdapter} from './adapter';

export const registerMiddleware = registerAdapterType("registerMiddleware", ExpressAdapter, (null: ?Middleware));
