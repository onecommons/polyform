// @flow

import {addCubeInterface} from 'polyform';
import type {PolyCube} from 'polyform';

export interface Logger {
  trace(obj: Object, format?: any, ...params: Array<any>): void;
  trace(format: string, ...params: Array<any>): void;
  debug(obj: Object, format?: any, ...params: Array<any>): void;
  debug(format: string, ...params: Array<any>): void;
  info(obj: Object, format?: any, ...params: Array<any>): void;
  info(format: string, ...params: Array<any>): void;
  warn(obj: Object, format?: any, ...params: Array<any>): void;
  warn(format: string, ...params: Array<any>): void;
  error(obj: Object, format?: any, ...params: Array<any>): void;
  error(format: string, ...params: Array<any>): void;
  fatal(obj: Object, format?: any, ...params: Array<any>): void;
  fatal(format: string, ...params: Array<any>): void;
}

export interface LogCube extends PolyCube {
  log: Logger,
  Logger: Class<Logger>
}

export const registerCube = addCubeInterface(__dirname, (null: ?LogCube));
