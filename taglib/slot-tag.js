const getLassoRenderContext = require('./getLassoRenderContext');
const lassoPageTag = require('./page-tag');
const extend = require('raptor-util/extend');
const path = require('path');
const util = require('./util');

const IS_PREBUILD_ENABLED = process.env.PREBUILD == true; // eslint-disable-line eqeqeq

function isAttributePresent (attrs) {
  return !!(attrs.inlineStyleAttrs ||
            attrs.inlineScriptAttrs ||
            attrs.externalStyleAttrs ||
            attrs.externalScriptAttrs);
}

function renderSlot (attrs, lassoPageResult, out, lassoRenderContext) {
  var lassoConfig = lassoRenderContext.getLassoConfig();

  var cspNonceProvider = lassoConfig.cspNonceProvider;
  var slotName = attrs.name;
  var cspAttrs = null;
  var slotData = null;

  if (cspNonceProvider) {
    cspAttrs = {
      nonce: cspNonceProvider(out)
    };
  }
  if (isAttributePresent(attrs) || cspAttrs) {
    slotData = {
      inlineScriptAttrs: extend(extend({}, attrs.inlineScriptAttrs), cspAttrs),
      inlineStyleAttrs: extend(extend({}, attrs.inlineStyleAttrs), cspAttrs),
      externalScriptAttrs: extend({}, attrs.externalScriptAttrs),
      externalStyleAttrs: extend({}, attrs.externalStyleAttrs)
    };
  }

  var slotHtml = lassoPageResult.getSlotHtml(slotName, slotData);

  if (slotHtml) {
    out.write(slotHtml);
  }

  lassoRenderContext.emitAfterSlot(slotName, out);
}

module.exports = function render (input, out) {
  var slotName = input.name;
  var lassoRenderContext = getLassoRenderContext(out);
  var lassoPageResultAsyncValue = lassoRenderContext.data.lassoPageResult;
  var timeout = lassoRenderContext.data.timeout || util.getDefaultTimeout();
  var template = out.global.template;
  var templateHasMetaDeps = template && template.getDependencies;

  const templatePath = template && template.path;

  if (IS_PREBUILD_ENABLED) {
    lassoRenderContext.emitBeforeSlot(slotName, out);

    const lasso = lassoRenderContext.getLasso();

    const asyncOut = out.beginAsync({
      name: 'lasso-slot:' + slotName,
      timeout: timeout
    });

    lasso.loadPrebuild({ path: templatePath })
      .then((lassoPageResult) => {
        renderSlot(input, lassoPageResult, asyncOut, lassoRenderContext);
        asyncOut.end();
      })
      .catch((err) => {
        process.nextTick(() => asyncOut.error(err));
      });
    return;
  }

  if (!lassoPageResultAsyncValue) {
    var pageConfig = lassoRenderContext.data.config || {};

    if (!templateHasMetaDeps && !pageConfig.dependencies && !pageConfig.packagePaths) {
      throw new Error('Lasso page result not found for slot "' + slotName + '". The <lasso-page> tag should be used to lasso the page.');
    }

    var dependencies = templateHasMetaDeps ? template.getDependencies() : [];

    if (pageConfig.packagePaths) {
      dependencies = pageConfig.packagePaths.concat(dependencies);
    }

    if (pageConfig.dependencies) {
      dependencies = dependencies.concat(pageConfig.dependencies);
    }

    if (out.global.dependencies) {
      dependencies = dependencies.concat(out.global.dependencies);
    }

    pageConfig.dependencies = dependencies;
    pageConfig.cacheKey = pageConfig.cacheKey || templatePath;
    pageConfig.dirname = pageConfig.dirname || (template && path.dirname(template.path));
    pageConfig.filename = pageConfig.filename || templatePath;
    pageConfig.flags = pageConfig.flags || out.global.flags || [];

    lassoPageTag(pageConfig, out);

    lassoRenderContext = getLassoRenderContext(out);
    lassoPageResultAsyncValue = lassoRenderContext.data.lassoPageResult;
  }

  lassoRenderContext.emitBeforeSlot(slotName, out);

  if (lassoPageResultAsyncValue.isResolved()) {
    renderSlot(input, lassoPageResultAsyncValue.data, out, lassoRenderContext);
  } else {
    var asyncOut = out.beginAsync({
      name: 'lasso-slot:' + slotName,
      timeout: timeout
    });

    lassoPageResultAsyncValue.done(function (err, lassoPageResult) {
      if (err) {
        // Trigger the error next tick so that it doesn't prevent
        // other listeners from being invoked in calling asyncOut.error()
        // triggers another error
        process.nextTick(() => {
          asyncOut.error(err);
        });

        return;
      }

      renderSlot(input, lassoPageResult, asyncOut, lassoRenderContext);
      asyncOut.end();
    });
  }
};
