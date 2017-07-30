// this is used to avoid having to install our custom module resolvers
// it can't do any real work because it gets ignore in environments
// use module name mapping, such as the webpack adapter.
// will load the default implementation if no other implementation is configured for use
module.exports = global.polyform.loadPolyCube(__dirname);
