var slotTag = require('./slot-tag');
var extend = require('raptor-util/extend');

const SLOT_DEFAULTS = {
  name: 'head'
};

module.exports = function render (input, out) {
  if (out.global.__lassoHeadRendered) {
    return;
  }

  out.global.__lassoHeadRendered = true;

  var slotTagInput = Object.create(SLOT_DEFAULTS);
  slotTag(extend(slotTagInput, input), out);
};
