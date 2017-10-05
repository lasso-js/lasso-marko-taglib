const VAR_NODE_NAME = 'asset-var';
const resolve = require('lasso-resolve-from');

const attrTags = {
  src: [ 'audio', 'embed', 'iframe', 'img', 'input', 'script', 'source', 'track', 'video' ],
  href: [ 'a', 'area', 'link' ],
  data: [ 'object' ],
  poster: [ 'video' ],
  srcset: [ 'img' ], // something else needs to happen here
  background: [ 'body' ]
};

const tagAttrs = Object.keys(attrTags).reduce((tagAttrs, attrName) => {
  attrTags[attrName].forEach(tagName => {
    tagAttrs[tagName] = true;
    tagAttrs[tagName + ':' + attrName] = true;
  });
  return tagAttrs;
}, {});

const nodeHandlers = {
  ArrayExpression: true,
  ObjectExpression: true,
  Property: true,
  LogicalExpression: true,
  ConditionalExpression: (node, walker) => {
    node.consequent = walker.walk(node.consequent);
    node.alternate = walker.walk(node.alternate);
    walker.skip();
  },
  Literal: (node, walker, context, attr, varNode, id) => {
    var builder = context.builder;
    var literal = builder.literal;
    var memberExpression = builder.memberExpression;

    if (isFileSystemPath(node.value, context.dirname)) {
      let varName = toVarName(attr.name, id());
      varNode.setAttributeValue(varName, literal(node.value));
      return memberExpression(varName, 'url');
    }
  }
};

const protocolPattern = /^[a-z]{2,}\:/i; // eslint-disable-line no-useless-escape

function isFileSystemPath (path, dirname) {
  if (!path) return false;
  if (typeof path !== 'string') return false;
  if (protocolPattern.test(path)) return false;
  return !!tryResolve(path, dirname);
}

function tryResolve (path, dirname) {
  try {
    return resolve(dirname, path).path;
  } catch (error) {}
}

function toVarName (name, id) {
  return '__' + name.replace(/-([a-z])/g, s => s[1].toUpperCase()).replace(/[^0-9a-z]/gi, '') + (id || '');
}

module.exports = function transform (el, context) {
  var parentNode = el.parentNode;
  var alreadyWrapped = parentNode.tagName === VAR_NODE_NAME;
  var varNode = alreadyWrapped ? parentNode : context.createNodeForEl(VAR_NODE_NAME);

  if (tagAttrs[el.tagName]) {
    el.attributes.forEach(attr => {
      if (!tagAttrs[el.tagName + ':' + attr.name]) return;

      var ids = 0;
      var idGen = () => ids++;
      var walker = context.createWalker({
        enter: (node) => {
          let nodeHandler = nodeHandlers[node.type];

          if (!nodeHandler) return walker.skip();
          if (nodeHandler === true) return;

          var value = nodeHandler(node, walker, context, attr, varNode, idGen);
          if (value) {
            el.setAttributeValue(attr.name, value);
          }
        }
      });

      walker.walk(attr.value);
    });
  }

  if (!alreadyWrapped && varNode.attributes.length) el.wrapWith(varNode);
};
