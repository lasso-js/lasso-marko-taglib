const attrTags = {
  src: [
    'audio',
    'embed',
    'iframe',
    'img',
    'input',
    'script',
    'source',
    'track',
    'video'
  ],
  href: ['a', 'area', 'link'],
  data: ['object'],
  poster: ['video'],
  srcset: ['img'],
  // something else needs to happen here
  background: ['body']
};
const tagAttrs = Object.keys(attrTags).reduce((tagAttrs, attrName) => {
  attrTags[attrName].forEach((tagName) => {
    tagAttrs[tagName] = tagAttrs[tagName] || {};
    tagAttrs[tagName][attrName] = true;
  });
  return tagAttrs;
}, {});

module.exports = function transform (a, b) {
  (a.hub ? transformMarko5 : transformMarko4)(a, b);
};

function transformMarko5 (tag, t) {
  if (!tag.get('name').isStringLiteral()) {
    return;
  }

  const tagName = tag.get('name.value').node;
  const checkAttrs = tagAttrs[tagName];
  const file = tag.hub.file;
  let resourceLookup;

  if (!checkAttrs) {
    return;
  }

  tag.get('attributes').forEach((attr) => {
    if (!checkAttrs[attr.get('name').node]) {
      return;
    }

    const { confident, value } = attr.get('value').evaluate();

    if (!confident || !isAssetPath(value)) {
      return;
    }

    resourceLookup || (resourceLookup = {});
    resourceLookup[value] = `lasso_resource_${(file.nextGetImageInfoVarId =
      (file.nextGetImageInfoVarId || 0) + 1)}`;
    attr.set(
      'value',
      t.memberExpression(
        t.identifier(resourceLookup[value]),
        t.identifier('url')
      )
    );
  });

  if (resourceLookup) {
    let replacement = tag.node;

    for (const request in resourceLookup) {
      replacement = t.markoTag(
        t.stringLiteral('lasso-resource'),
        [
          t.markoAttribute('path', t.stringLiteral(request)),
          t.markoAttribute('var', t.stringLiteral(resourceLookup[request]))
        ],
        t.markoTagBody([replacement])
      );
    }

    tag.replaceWith(replacement);
  }
}

function transformMarko4 (el, context) {
  const builder = context.builder;
  const checkAttrs = tagAttrs[el.tagName];

  if (!checkAttrs) {
    return;
  }

  let resourceLookup;

  el.attributes.forEach((attr) => {
    if (!checkAttrs[attr.name]) {
      return;
    }

    const walker = context.createWalker({
      enter: (node) => {
        switch (node.type) {
          case 'ArrayExpression':
          case 'ObjectExpression':
          case 'Property':
          case 'LogicalExpression':
            return;
          case 'ConditionalExpression':
            node.consequent = walker.walk(node.consequent);
            node.alternate = walker.walk(node.alternate);
            walker.skip();
            break;
          case 'Literal': {
            const { value } = node;

            if (!isAssetPath(value)) {
              return;
            }

            resourceLookup || (resourceLookup = {});
            resourceLookup[value] = `lasso_resource_${
              1 + (context.assetCount || (context.assetCount = 0))
            }`;
            walker.replace(
              builder.memberExpression(
                builder.identifier(resourceLookup[value]),
                builder.identifier('url')
              )
            );
            break;
          }
          default:
            walker.skip();
            break;
        }
      }
    });

    attr.value = walker.walk(attr.value);
  });

  if (resourceLookup) {
    let curEl = el;

    for (const request in resourceLookup) {
      const resourceTag = context.createNodeForEl('lasso-resource');
      resourceTag.setAttributeValue(
        'var',
        builder.literal(resourceLookup[request])
      );
      resourceTag.setAttributeValue('path', builder.literal(request));
      curEl.wrapWith(resourceTag);
      curEl = resourceTag;
    }
  }
}

function isAssetPath (relativePath) {
  if (typeof relativePath !== 'string') return false;
  if (relativePath[0] === '/') return false; // Ignore absolute paths.
  if (!/\.[^.]+$/.test(relativePath)) return false; // Ignore paths without a file extension.
  if (/^[a-z]{2,}:/i.test(relativePath)) return false; // Ignore paths with a protocol.
  return true;
}
