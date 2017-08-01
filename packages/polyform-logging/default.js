import type {Logger as ILogger} from './interfaces';

export class SimpleLogger implements ILogger {

};

// this instance become part of the signature of the polycube
// and the runtime needs to remember this and check in the derived polycube exports it too
export const log = new SimpleLogger();
export const Logger = SimpleLogger;

export const __cube = __filename;
