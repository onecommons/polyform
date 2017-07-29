//import {registerCube} from 'polyform-logging/interfaces';
import type {Logger} from 'polyform-logging/interfaces';

class BunyanLogger implements Logger {

};

export const Logger = BunyanLogger;
export const log = new BunyanLogger();

export const __cube = __filename;

//this is used to declare and verify that this package implements the logging interface
//if this module is loaded loadPolyCube() it throw an error if this isn't called
//registerCube(__filename, exports); //call at end of module
