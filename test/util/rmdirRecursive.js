const nodePath = require('path');
const fs = require('fs');

module.exports = function rmdirRecursive (dir) {
  var filenames;

  try {
    filenames = fs.readdirSync(dir);
  } catch (e) {
    return;
  }

  filenames.forEach(function (filename) {
    var path = nodePath.join(dir, filename);

    if (fs.lstatSync(path).isDirectory()) {
      rmdirRecursive(path);
    } else {
      fs.unlinkSync(path);
    }
  });

  fs.rmdirSync(dir);
};
