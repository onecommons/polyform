// build.js needs to be in separate module because imports are hoisted:
import './build.js'

import {log} from "polyform-logging";
import {registerMiddleware} from 'polyform-express'; //explicit interface

log.info("loading...");

function test(req, res, next) {
  res.send('<p>Hello World</p>');
  next();
}

registerMiddleware(test)

export const config = {
  main: './run.js'
};
