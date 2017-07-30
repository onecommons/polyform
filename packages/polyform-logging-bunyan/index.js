import Bunyan from 'bunyan';
//note bunyan logger class is already compatible with our Logger interface
export const Logger = Bunyan;
//XXX pass options from config into createLogger
export const log = Bunyan.createLogger();

export const __cube = __filename;
