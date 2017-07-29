//import if there is will throw if polyform runtime
import {log} from "polyform-logging";

log.info("it works!");

// hmm, registerMiddleware shouldn't be avaiable at runtime, only load time
//import {app, registerMiddleware} from 'polyform-express'; //explicit interface
//function test(req, res, next) {}
//registerMiddleware(test)

//app.start();
