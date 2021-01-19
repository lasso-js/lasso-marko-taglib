/**
 * This method walks up the tree from the provided node to find the
 * root "_lasso-resources-root" node. The root node is what asynchronously
 * loads all of the bundles and asynchronously renders the body. If a
 * root "_lasso-resources-root" node is not found then a new one is created
 * and made to be a child of the true root. All of the child nodes
 * of the actual root node are moved to children of the newly created
 * node.
 *
 * @param node Node to search form
 * @param compiler Used to create the node if it is not found.
 */
module.exports = function transform (a, b) {
  (a.hub ? transformMarko5 : transformMarko4)(a, b);
};

function transformMarko5 (tag, t) {
  const attrs = tag.get('attributes');
  const varAttr = attrs.find((attr) => attr.node.name === 'var');
  const requestAttr = attrs.find((attr) => attr.node.name === 'path');
  let rootTag;

  if (!varAttr || !varAttr.get('value').isStringLiteral()) {
    throw (varAttr || tag.get('name')).buildCodeFrameError(
      '<lasso-resource> requires a var attribute that is a string.'
    );
  }

  if (!requestAttr) {
    throw (requestAttr || tag.get('name')).buildCodeFrameError(
      '<lasso-resource> requires a path attribute that is a string.'
    );
  }

  if (
    tag.parentPath.isMarkoTagBody() &&
    tag.parentPath.parent.name.value === '_lasso-resources-root'
  ) {
    rootTag = tag.parentPath.parentPath;
  } else {
    const body = tag.get('body');
    const hasBodyContent = body.get('body').length;
    [rootTag] = tag.insertBefore(
      t.markoTag(
        t.stringLiteral('_lasso-resources-root'),
        [t.markoAttribute('paths', t.arrayExpression([]))],
        hasBodyContent ? body.node : t.markoTagBody([])
      )
    );

    if (!hasBodyContent) {
      // Move all next siblings into the resources root.
      let cur = tag.getNextSibling();

      while (cur.node) {
        const next = cur.getNextSibling();
        rootTag.get('body').pushContainer('body', cur.node);
        cur.remove();
        cur = next;
      }
    }
  }

  let requestValue = requestAttr.node.value;

  if (t.isStringLiteral(requestValue)) {
    requestValue = t.callExpression(
      t.memberExpression(t.identifier('require'), t.identifier('resolve')),
      [requestValue]
    );
  }

  rootTag
    .get('body')
    .pushContainer('params', t.identifier(varAttr.node.value.value));

  rootTag
    .get('attributes')[0]
    .get('value')
    .pushContainer('elements', requestValue);

  tag.remove();
}

function transformMarko4 (el, context) {
  let builder = context.builder;

  let resourcesRootNode;

  if (el.childCount === 0) {
    resourcesRootNode = context.data.lassoResourcesNode;

    if (!resourcesRootNode) {
      resourcesRootNode = context.data.lassoResourcesNode = builder.containerNode(
        function lassoResourcesCodeGenerator () {
          let resources = resourcesRootNode.data.resources;
          let resourcesCustomTag = context.createNodeForEl({
            tagName: '_lasso-resources-root',
            body: resourcesRootNode.body
          });

          let paths = [];

          resources.forEach((resource) => {
            paths.push(resource.path);
            resourcesCustomTag.addNestedVariable(resource.varName);
          });

          resourcesCustomTag.setAttributeValue('paths', builder.literal(paths));

          return resourcesCustomTag;
        }
      );

      context.root.moveChildrenTo(resourcesRootNode);
      context.root.appendChild(resourcesRootNode);
    }
  } else {
    resourcesRootNode = builder.containerNode(
      function lassoResourcesCodeGenerator () {
        let resources = resourcesRootNode.data.resources;
        let resourcesCustomTag = context.createNodeForEl({
          tagName: '_lasso-resources-root',
          body: resourcesRootNode.body
        });

        let paths = [];

        resources.forEach((resource) => {
          paths.push(resource.path);
          resourcesCustomTag.addNestedVariable(resource.varName);
        });

        resourcesCustomTag.setAttributeValue('paths', builder.literal(paths));

        return resourcesCustomTag;
      }
    );

    el.replaceWith(resourcesRootNode);
    el.moveChildrenTo(resourcesRootNode);
  }

  if (!resourcesRootNode.data.resources) {
    resourcesRootNode.data.resources = [];
  }

  let resources = resourcesRootNode.data.resources;

  let varName = el.getAttributeValue('var');
  if (varName.type === 'Literal' && typeof varName.value === 'string') {
    varName = varName.value;
  } else {
    context.addError(el, 'Invalid "var". String literal expected');
    return;
  }

  let pathExpression = el.getAttributeValue('path');

  pathExpression = context.resolvePath(pathExpression);

  resources.push({
    varName: varName,
    path: pathExpression
  });

  el.detach();
}
