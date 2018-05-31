import {
  Tapable,
  AsyncParallelHook,
  SyncHook
} from "tapable";
import React from "react";
import { renderToNodeStream } from "react-dom/server";
import Html from "../components/html";
import {matchRoutes, renderRoutes} from "react-router-config";
import { StaticRouter } from "react-router";

export default class ServerHandler extends Tapable {

  constructor(options) {
    super();
    this.hooks = {
      "clientBeforeRender": new AsyncParallelHook(),
      "clientRenderComplete": new SyncHook(),
    };
    this.options = options;
  }

  run({ routeHandler, req, res, next, assets }) {

    res.write("<!DOCTYPE html>");

    if (!res.locals.ssr) {
      renderToNodeStream(
        <Html
          assets={assets}
        />
      ).pipe(res);
      return next();
    }

    let routes = routeHandler.getRoutes();

    let currentPageRoutes = matchRoutes(routes, req.path);
    let context = {};

    let promises = [];
    let preloadedData = [];

    currentPageRoutes.forEach(({route}) => {
      if (route.component.preload) {
        promises.push(route.component.preload());
      }
    });
    Promise.all(promises).then(args => {

      currentPageRoutes.forEach((r,i) => {

        preloadedData.push(args[i][1]);
      });

      //console.log(preloadedData);


      // Render according to routes!
      renderToNodeStream(
        <Html
          assets={assets}
          preloadedData={preloadedData}
        >
          <StaticRouter location={req.url}  context={context}>
            {renderRoutes(routes)}
          </StaticRouter>
        </Html>
      ).pipe(res);
      // Free some memory
      routes = null;
      currentPageRoutes = null;
      context = null;
      promises = null;

      return next();
    });
  }
}