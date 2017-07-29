//@flow
//only problem with doing this here is order of initialization
//if an implementation relies on interface that hasn't been loaded first
import {registerCube as registerLoggingCube} from 'polyform-logging/interfaces';
import * as impl from 'polyform-logging/defaults';
registerLoggingCube(impl);

//usage:
//import {log} from 'polyform-logging'; //index.js: module.exports = getImpl(__dirname)
