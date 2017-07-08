module.exports = {
  configDefaults: {},
  name: 'test',
  // when installing into a environment, use the associated modules
  entryPoints: {
    webapp: __dirname + '/transpiled',
    test:   __dirname + '/transpiled'
  }
};
