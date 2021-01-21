module.exports = function transform (a, b) {
  (a.hub ? transformMarko5 : transformMarko4)(a, b);
};

function transformMarko5 (tag, t) {
  tag.pushContainer('attributes', t.markoAttribute('dirname', t.identifier('__dirname')));
  tag.pushContainer('attributes', t.markoAttribute('filename', t.identifier('__filename')));
}

function transformMarko4 (el, context) {
  const builder = context.builder;
  el.setAttributeValue('dirname', builder.identifier('__dirname'));
  el.setAttributeValue('filename', builder.identifier('__filename'));
}
