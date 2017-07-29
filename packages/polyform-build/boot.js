module.exports = function loadEnvironment(root: string, app: string = 'app'): any {
  try {
    //load config and create environment
    require('rebase/runtime')(root);
    return require(root + '/build/'+app);
  } catch (e) {
    if (e.code = 'MODULE_NOT_FOUND') {
      return rebuild();
    } else if (e instanceof OutOfDateBuild) {
      if (useStale) {
        return e.getExports();
      } else {
        return rebuild();
      }
    } else {
      throw e;
    }
  }
}
