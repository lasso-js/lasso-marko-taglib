module.exports = function (input, out) {
  var renderBody = input.renderBody;
  var values = input.values;

  if (!renderBody) {
    return;
  }

  renderBody.apply(null, [out].concat(values.map(val => require(val))));
};
