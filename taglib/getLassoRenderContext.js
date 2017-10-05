var LassoRenderContext = require('./LassoRenderContext');
var CONTEXT_KEY = 'lasso/LassoRenderContext';
var lasso = require('lasso');

function getLassoRenderContext (out) {
  var global = out.global;
  var theLasso = global.lasso;

  if (!theLasso) {
    theLasso = lasso.defaultLasso;
  }

  return global[CONTEXT_KEY] ||
        (global[CONTEXT_KEY] = new LassoRenderContext(theLasso));
}

module.exports = getLassoRenderContext;
