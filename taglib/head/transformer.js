module.exports = function transform (a, b) {
  (a.hub ? transformMarko5 : transformMarko4)(a, b);
};

function transformMarko5 (tag, t) {
  tag
    .get('body')
    .pushContainer(
      'body',
      t.markoTag(t.stringLiteral('lasso-head'), [], t.markoTagBody([]))
    );
}

function transformMarko4 (el, context) {
  var lasso = context.createNodeForEl('lasso-head');
  el.appendChild(lasso);
}
