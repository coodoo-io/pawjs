const syntax =  require("babel-plugin-syntax-dynamic-import");

module.exports = ({types: t}) => ({
  inherits: syntax,

  visitor: {
    Import(path) {

      const parent = path.parentPath.parent;
      if (parent.type !== "ObjectProperty") return;
      if (parent.key.name !== "component") return;

      const source = path.parentPath.node.arguments[0].value;

      try {

        const obj = path.parentPath.parentPath;

        let propertiesMap = {};
        let newContainer = [];

        obj.container.forEach(property => {
          propertiesMap[property.key.name] = property.value.value;
          newContainer.push(property);
        });

        if (propertiesMap.webpack || propertiesMap.modules) {
          return;
        }

        const moduleObj = t.objectProperty(
          t.identifier("modules"),
          t.arrayExpression([
            t.StringLiteral(source)
          ])
        );

        const webpackObj = t.objectProperty(
          t.identifier("webpack"),
          t.arrowFunctionExpression(
            [],
            t.arrayExpression(
              [
                t.callExpression(
                  t.memberExpression(
                    t.identifier("require"),
                    t.identifier("resolveWeak"),
                  ),
                  [t.StringLiteral(source)],
                )
              ]
            )
          )
        );

        obj.parentPath.pushContainer("properties", moduleObj);
        obj.parentPath.pushContainer("properties", webpackObj);
      } catch(ex) {
        // eslint-disable-next-line
        console.log(ex);
      }
    },
  },
});