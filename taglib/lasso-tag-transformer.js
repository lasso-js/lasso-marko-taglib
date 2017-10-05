const lassoNonceAttrTransformer = require('./lasso-nonce-attr-transformer');
const lassoAttributeTransformer = require('./lasso-attribute-transformer');

module.exports = function transform (el, context) {
  lassoNonceAttrTransformer(el, context);
  lassoAttributeTransformer(el, context);
};
