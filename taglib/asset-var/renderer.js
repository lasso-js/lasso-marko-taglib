var getLassoRenderContext = require('../getLassoRenderContext');

module.exports = function (input, out) {
  var renderBody = input.renderBody;
  var values = input.values;

  if (!renderBody) {
    return;
  }

  var lassoRenderContext = getLassoRenderContext(out);
  var theLasso = input.lasso || lassoRenderContext.lasso;

  if (!theLasso) {
    throw new Error('Page lasso not configured for application. Use require("lasso").configureDefault(config) to configure the default page lasso or provide an lasso as input using the "lasso" attribute.');
  }

  var lassoContext = lassoRenderContext.data.lassoContext;

  if (!lassoContext) {
    lassoContext = lassoRenderContext.data.lassoContext = theLasso.createLassoContext({
      data: {
        renderContext: out
      }
    });
  }

  var asyncOut = out.beginAsync();

  Promise.all(
    values.map(val => lassoResource(theLasso, lassoContext, val))
  ).then(resources => {
    renderBody.apply(null, [asyncOut].concat(resources));
    asyncOut.end();
  });
};

function lassoResource (lasso, context, path) {
  return new Promise(function (resolve, reject) {
    const result = lasso.lassoResource(path, context, function (err, result) {
      if (err) return reject(err);
      else resolve(result);
    });

    if (result && result.then) {
      result.then((data) => resolve(data))
        .catch((err) => reject(err));
    }
  });
}
