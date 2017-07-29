// @flow

import {addCubeInterface} from 'polyform';
import type {PolyCube} from 'polyform';

export interface Logger {
  debug(obj: Object, format?: any, ...params: Array<any>): void;
  debug(format: string, ...params: Array<any>): void;
  info(obj: Object, format?: any, ...params: Array<any>): void;
  info(format: string, ...params: Array<any>): void;
}

export interface LogCube extends PolyCube {
  log: Logger,
  Logger: Class<Logger>
}

export const registerCube = addCubeInterface(__dirname, (null: ?LogCube));
