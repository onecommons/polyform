"use strict";
var assert = require('assert');
// "// @component" triggers transpiling
rebase$startComponentLoad(__dirname, __filename);

console, setTimeout; //just to test if standard global are present

//import type {type1} from "!";
rebase$findTypesInEnvironment("type1");

var var7 = "var7";
exports.var7 = rebase$adapt("var7", "type1", var7);
//assert(exports.exportname.wrapped === var7, "export should have been adapted");

rebase$endComponentLoad(__dirname, __filename);
