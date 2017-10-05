module.exports = function (el, context) {
  var builder = context.builder;
  var identifier = builder.identifier;
  var arrayExpression = builder.arrayExpression;
  var functionDeclaration = builder.functionDeclaration;
  var requireResolve = builder.requireResolve;

  var body = el.body;
  var attrs = el.attributes;
  var out = identifier('out');
  var params = [out].concat(attrs.map(attr => identifier(attr.name)));
  var renderBody = functionDeclaration('renderBody', params, body);
  var values = arrayExpression(attrs.map(attr => requireResolve(attr.value)));

  el.removeAllAttributes();
  delete el.body;

  el.setAttributeValue('values', values);
  el.setAttributeValue('renderBody', renderBody);
};
