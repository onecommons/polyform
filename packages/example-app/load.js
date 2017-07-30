import {log} from "polyform-logging";
import {registerMiddleware} from 'polyform-express'; //explicit interface

log.info("loading...");

function test(req, res, next) {
  res.send('<p>Hello World</p>');
  next();
}

registerMiddleware(test)
