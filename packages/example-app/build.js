// @flow

// do this declaratively so flow will statically check interfaces during build-time
// XXX this file should be generated from the config
import {registerCube as registerLoggingCube} from 'polyform-logging/interfaces';
import * as impl from 'polyform-logging/default';
registerLoggingCube(impl);
