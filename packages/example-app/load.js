import {log} from "polyform-logging";
import {registerMiddleware} from 'polyform-express'; //explicit interface

log.info("loading...");

function test(req, res, next) {}
registerMiddleware(test)
