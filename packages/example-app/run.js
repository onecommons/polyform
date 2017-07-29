//import will throw if no polyform runtime
import {log} from "polyform-logging";
import {app} from 'polyform-express'; //explicit interface

log.info("running");
app.start();
