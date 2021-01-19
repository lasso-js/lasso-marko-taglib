var getImageInfoHelperPath = require.resolve('./helper-getImageInfo');

module.exports = function translate (a, b) {
  (a.hub ? translateMarko5 : translateMarko4)(a, b);
};

function translateMarko5 (tag, t) {
  if (tag.node.lassoTranslated) {
    return;
  }

  var file = tag.hub.file;
  var utils = require('@marko/babel-utils');
  var srcValue = getAttrValue('src');
  tag.node.lassoTranslated = true;

  if (!srcValue || !srcValue.isStringLiteral()) {
    throw (srcValue || tag.get('name')).buildCodeFrameError(
      '<lasso-img> requires a src attribute that is a string.'
    );
  }

  if (tag.get('body').get('body').length) {
    throw tag
      .get('name')
      .buildCodeFrameError('<lasso-img> does not support body content.');
  }

  var src = utils.resolveRelativePath(file, srcValue.node.value);
  var getImageInfoVar = utils.importDefault(
    file,
    getImageInfoHelperPath,
    'lassoGetImageInfo'
  );
  var imageInfoVar = t.identifier(
    'lassoImageInfo' +
      (file.nextGetImageInfoVarId = (file.nextGetImageInfoVarId || 0) + 1)
  );

  tag.set('name', t.stringLiteral('img'));
  srcValue.replaceWith(t.memberExpression(imageInfoVar, t.identifier('url')));

  if (!getAttrValue('width')) {
    tag.pushContainer(
      'attributes',
      t.markoAttribute(
        'width',
        t.memberExpression(imageInfoVar, t.identifier('width'))
      )
    );
  }

  if (!getAttrValue('height')) {
    tag.pushContainer(
      'attributes',
      t.markoAttribute(
        'height',
        t.memberExpression(imageInfoVar, t.identifier('height'))
      )
    );
  }

  var bodyContent = t.blockStatement([]);
  bodyContent.body.push(t.cloneDeep(tag.node));

  tag.replaceWith(
    t.callExpression(getImageInfoVar, [
      t.identifier('out'),
      t.callExpression(
        t.memberExpression(t.identifier('require'), t.identifier('resolve')),
        [t.stringLiteral(src)]
      ),
      t.arrowFunctionExpression(
        [t.identifier('out'), imageInfoVar],
        bodyContent
      )
    ])
  );

  function getAttrValue (name) {
    var attr = tag.get('attributes').find((attr) => attr.node.name === name);
    return attr && attr.get('value');
  }
}

function translateMarko4 (el, codegen) {
  if (el.isFlagSet('lassoTranslated')) {
    return el;
  }

  el.setFlag('lassoTranslated');

  var builder = codegen.builder;
  var context = codegen.context;

  var getImageInfoRequirePath = codegen.getRequirePath(getImageInfoHelperPath);
  var getImageInfoVar = codegen.importModule(
    '__getImageInfo',
    getImageInfoRequirePath
  );

  var nextVarId =
    context.data.nextGetImageInfoVarId ||
    (context.data.nextGetImageInfoVarId = 0);
  var imageInfoVar = builder.identifier('imageInfo' + nextVarId++);

  var src = codegen.resolvePath(el.getAttributeValue('src'));

  el.setAttributeValue(
    'src',
    builder.memberExpression(imageInfoVar, builder.identifier('url'))
  );

  if (!el.hasAttribute('width')) {
    el.setAttributeValue(
      'width',
      builder.memberExpression(imageInfoVar, builder.identifier('width'))
    );
  }

  if (!el.hasAttribute('height')) {
    el.setAttributeValue(
      'height',
      builder.memberExpression(imageInfoVar, builder.identifier('height'))
    );
  }

  // Convert the <lasso-img> tag over to <img>
  el.setTagName('img');
  el.openTagOnly = true;

  return builder.functionCall(getImageInfoVar, [
    builder.identifierOut(),
    src,
    builder.functionDeclaration(
      null, // Callback name
      [
        // Callback params
        builder.identifierOut(),
        imageInfoVar
      ],
      [
        // Callback function body
        el
      ]
    )
  ]);
}
