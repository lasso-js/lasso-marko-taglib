var slotTag = require('./slot-tag');
var extend = require('raptor-util/extend');

const SLOT_DEFAULTS = {
  name: 'body'
};

module.exports = function render (input, out) {
  if (out.global.__lassoBodyRendered) {
    return;
  }

  out.global.__lassoBodyRendered = true;

  var slotTagInput = Object.create(SLOT_DEFAULTS);
  slotTag(extend(slotTagInput, input), out);
};
