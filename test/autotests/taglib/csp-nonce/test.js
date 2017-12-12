exports.getLassoConfig = function () {
  return {
    bundlingEnabled: true,
    fingerprintsEnabled: true,
    plugins: [ require('lasso-marko') ],
    cspNonceProvider: function (out, lassoContext) {
      return out.global.cspNonce;
    }
  };
};

exports.getTemplateData = function () {
  return {
    $global: {
      cspNonce: 'abc'
    }
  };
};
