module.exports = function (el, context) {
  var refresh = context.createNodeForEl('browser-refresh');
  var lasso = context.createNodeForEl('lasso-body');
  el.appendChild(refresh);
  el.appendChild(lasso);
};
