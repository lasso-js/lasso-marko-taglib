const nodePath = require('path');
require('chai').config.includeStack = true;
const marko = require('marko');
const lasso = require('lasso');
const rmdirRecursive = require('./util/rmdirRecursive');
const buildDir = nodePath.join(__dirname, 'build');
const fs = require('fs');

const MARKO_INIT_REGEX = /^.*(src="((.*?))\.marko.init-((.*?)\.)js").*$/gm;

function replaceMarkoInit (html) {
  MARKO_INIT_REGEX.lastIndex = 0;
  const regexMarkoInit = MARKO_INIT_REGEX.exec(html);

  if (regexMarkoInit) {
    const srcAttr = regexMarkoInit[1];
    const hashAttr = regexMarkoInit[5];
    html = html.replace(srcAttr, `src="/static/template.marko.init-${hashAttr}.js"`);
  }

  return html;
}

describe('lasso/taglib', function () {
  require('./autotest').scanDir(
    nodePath.join(__dirname, 'autotests/taglib'),
    function (dir, helpers) {
      var testName = nodePath.basename(dir);
      var pageName = 'taglib-' + testName;

      var mainPath = nodePath.join(dir, 'test.js');
      var main;

      if (fs.existsSync(mainPath)) {
        main = require(mainPath);
      } else {
        main = {};
      }

      var lassoConfig = main.getLassoConfig && main.getLassoConfig();
      if (!lassoConfig) {
        lassoConfig = {
          bundlingEnabled: true,
          fingerprintsEnabled: true,
          plugins: [
            require('lasso-marko')
          ]
        };
      }

      if (!lassoConfig.outputDir) {
        lassoConfig.outputDir = nodePath.join(buildDir, pageName);
      }

      rmdirRecursive(lassoConfig.outputDir);

      var theLasso = lasso.create(lassoConfig, dir);

      // var main = require(nodePath.join(dir, 'test.js'));
      var templatePath = nodePath.join(dir, 'template.marko');
      var template = marko.load(templatePath);

      var templateData;

      if (main.getTemplateData) {
        templateData = main.getTemplateData();
      }

      if (!templateData) {
        templateData = {};
      }

      if (!templateData.$global) {
        templateData.$global = {};
      }

      templateData.$global.lasso = theLasso;
      templateData.pageName = pageName;

      return new Promise((resolve, reject) => {
        template.renderToString(templateData, function (err, html) {
          if (err) {
            return reject(err);
          }

          html = html.replace(/\$\d+\.\d+\.\d+/g, '$*');
          html = replaceMarkoInit(html);

          try {
            if (main.check) {
              main.check(html);
            } else {
              helpers.compare(html, '.marko');
            }
          } catch (err) {
            return reject(err);
          }

          resolve();
        });
      });
    });
});
