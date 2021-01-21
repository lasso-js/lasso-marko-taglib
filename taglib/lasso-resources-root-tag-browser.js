module.exports = function (input, out) {
  if (input.renderBody) {
    input.renderBody.apply(
      null,
      [out].concat(
        input.paths.map(function (path) {
          if (typeof path !== 'string') {
            throw new Error('<lasso-resource> only resource type assets (eg images) can be loaded in the browser via this tag.');
          }

          return require(path);
        })
      )
    );
  }
};
