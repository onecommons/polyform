"use strict";
var assert = require('assert');
// "// @component" triggers transpiling
rebase$startComponentLoad(__dirname, __filename);

console, setTimeout; //just to test if standard global are present

//import type {type1, type2} from "!";
rebase$findTypesInEnvironment("type1", "type2");

//import {var1, var2} from "!";
//const [var1, var2] =
var vars = rebase$getFromEnvironment("var1", "var2");
//see transpiled.test.js:
assert(vars.length === 2);
assert(vars[0] == "var1", "didn't retrieve global var1 properly");
assert(vars[1] === undefined, "missing global should be undefined");

//import {var1, var2} from "!env!componentPath";
//const [var3, var4] =
var xrefs1 = rebase$getRefAcrossEnvironment("webapp", "componentPath", "var1", "var2");
assert(xrefs1.length === 2);
assert(xrefs1[0] === undefined, "xref in component should be different from unspecified xref");
assert(xrefs1[1] === undefined, "missing xref should be undefined");

//import {var1, var2} from "!env!";
//const [var5, var6] =
var xrefs2 = rebase$getRefAcrossEnvironment("webapp", null, "var1");
assert(xrefs2.length === 1);
assert(xrefs2[0] === vars[0], 'var1 xref should be retrieved');

//export const exportname = ... : exporttype;
//export class exportname : exporttype {...};
//export function exportname : exporttype {...};
//note: disallow export let and export var
//don't support export {name}; for now
//export * from '...'; and export {name} from '...'; can stay as is,
//don't need to be transpiled unless we want to use {name} as hint to what to install
//export const exportname = var1: type1 //????
exports.exportname = rebase$adapt("exportname", "type1", vars[0]);
assert(exports.exportname.wrapped === vars[0], "export should have been adapted");

// import {var7} from "!componentPath";
const imports1 = rebase$loadComponent("./nestedComponent", __dirname, "var7");
// var7 should have already been adapted
assert(imports1[0], 'component var should have been imported');
assert(imports1[0] && imports1[0].wrapped === "var7", "component import should have been adapted")

// import {var7} from "!component";
var imports2 = rebase$loadComponent(__filename, __dirname, "var7");
assert(imports2.length === 1);
assert(imports2[0] === undefined, "loading self should return undefined exports ");

rebase$endComponentLoad(__dirname, __filename);
