import _ from "lodash";
import ClientHandler from "./handler";
import RouteHandler from "../router/handler";
import env from "../config/index";

try {

  let ProjectRoutes = require(`${process.env.__project_root}/src/routes`);
  if (ProjectRoutes.default) ProjectRoutes = ProjectRoutes.default;

  let ProjectClient = require(`${process.env.__project_root}/src/client`);
  if (ProjectClient.default) ProjectClient = ProjectClient.default;

  let rHandler = new RouteHandler({
    env: _.assignIn({}, env),
  });

  rHandler.addPlugin(new ProjectRoutes({addPlugin: rHandler.addPlugin}));

  let cHandler = new ClientHandler({
    env: _.assignIn({}, env),
  });
  cHandler.addPlugin(new ProjectClient({addPlugin: cHandler.addPlugin}));


  // Get all the routes async manner and execute the code!
  rHandler.hooks.initRoutes.callAsync(err => {
    if (err) {
      // eslint-disable-next-line
      console.log(err);
      return;
    }
    cHandler.run({
      routeHandler: rHandler
    });
  });

} catch (ex) {
  // eslint-disable-next-line
  console.log(ex);
}

if (module.hot) module.hot.accept();