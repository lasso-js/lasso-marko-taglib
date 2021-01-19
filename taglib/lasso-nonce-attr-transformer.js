var getNonceHelperPath = require.resolve('./helper-getNonce');

module.exports = function transform (a, b) {
  (a.hub ? transformMarko5 : transformMarko4)(a, b);
};

function transformMarko5 (tag, t) {
  var utils = require('@marko/babel-utils');
  var attrs = tag.get('attributes');

  for (var i = attrs.length; i--;) {
    if (attrs[i].node.name === 'lasso-nonce') {
      attrs[i].remove();
      tag.pushContainer(
        'attributes',
        t.markoAttribute(
          'nonce',
          t.callExpression(
            utils.importDefault(tag.hub.file, getNonceHelperPath, 'lassoGetNonce'),
            [t.identifier('out')]
          )
        )
      );
      break;
    }
  }
}

function transformMarko4 (el, context) {
  if (el.hasAttribute('lasso-nonce')) {
    el.removeAttribute('lasso-nonce');

    var builder = context.builder;

    var getNonceRequirePath = context.getRequirePath(getNonceHelperPath);

    var getNonceVar = context.importModule('__getNonce', getNonceRequirePath);

    el.setAttributeValue(
      'nonce',
      builder.functionCall(getNonceVar, [builder.identifierOut()])
    );
  }
}
