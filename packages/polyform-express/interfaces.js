import {registerAdapterType} from 'polyform';
import type {Middleware} from 'express';

registerAdapterType('registerMiddleware', (null: ?Middleware), __filename);
