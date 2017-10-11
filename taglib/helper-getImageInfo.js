var getLassoRenderContext = require('./getLassoRenderContext');
var getImageInfo = require('lasso/getImageInfo');

module.exports = function (out, path, callback) {
  var targetOut = out;
  var done = false;

  var lassoRenderContext = getLassoRenderContext(out);
  var theLasso = lassoRenderContext.lasso;

  getImageInfo(path, { lasso: theLasso, renderContext: out }, function (err, imageInfo) {
    done = true;
    if (err) return targetOut.error(err);

    callback(targetOut, imageInfo);

    if (targetOut !== out) {
      targetOut.end();
    }
  });

  if (!done) {
    targetOut = out.beginAsync();
  }
};
