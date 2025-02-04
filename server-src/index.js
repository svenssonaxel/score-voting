require("core-js/stable");
require("regenerator-runtime/runtime");

const path = require("path");
const fs = require("fs");
const util = require("util");
const { promisify } = require("util");
const express = require("express");
const httpProxy = require("http-proxy");
const http = require("axios");

const renderApp = require("./renderApp.js").default;
const mip = require("./mip.js");
const utils = require("./utils.js");

const prod = process.env.NODE_ENV == "production";
const PORT = process.env.PORT || (prod ? 80 : 3006);
const app = express();
const expressWs = require("express-ws")(app);

async function getIndexFileContents() {
  if (prod) {
    const readFile = promisify(fs.readFile);
    const indexFile = path.resolve("./frontend/index.html");
    const data = await readFile(indexFile, "utf8");
    return data;
  } else {
    const response = await http.get("http://localhost:3000/index.html");
    return response.data;
  }
}

const appHandler = (propsFun) => async (req, res) => {
  const props = await propsFun(req);
  const app = renderApp(props);
  const template = await getIndexFileContents();
  return res.send(
    template.replace('<div id="root"></div>', `<div id="root">${app}</div>`)
  );
};

function getFrontpageModel() {
  return { view: "frontpage", newDocumentPath: `/d/${utils.rndId()}` };
}

async function getDocumentModel(id) {
  const document = await mip.getDocument(id);
  return { view: "document", document };
}

app.use(express.json());

// We're using an old version of ExpressJS without built-in support for async error handling
const handleAsyncErrors = (fun) => async (req, res, next) => {
  try {
    await fun(req, res);
  } catch (error) {
    next(error);
  }
};

// Server-side rendered pages

app.get(
  "/",
  appHandler(() => ({ view: "frontpage", newDocumentPath: null }))
);

app.get(
  "/d/:id",
  handleAsyncErrors(
    appHandler(async (req) => await getDocumentModel(req.params.id))
  )
);

// Models fetched by client-side scripts

app.get("/modelfor/", (req, res) => res.send(getFrontpageModel()));

app.get(
  "/modelfor/d/:id",
  handleAsyncErrors(async (req, res) => {
    const ret = await getDocumentModel(req.params.id);
    return res.send(ret);
  })
);

app.post(
  "/send/d/:id",
  handleAsyncErrors(async (req, res) => {
    const id = req.params.id;
    const cmd = req.body;
    await mip.send(id, cmd);
    return res.send("ok");
  })
);

app.ws("/realtimecmdsfor/d/:id", (ws, req) => {
  const id = req.params.id;
  const deliver = (cmd) => ws.send(JSON.stringify(cmd));
  ws.on("close", (code, reason) => mip.off(id, deliver));
  ws.on("error", (error) => ws.close());
  ws.on("message", (data) => mip.on(id, deliver));
  ws.on("open", () => mip.on(id, deliver));
});

app.get(
  "/cmdsfor/d/:id/since/:revision",
  handleAsyncErrors(async (req, res) => {
    const { id, revision } = req.params;
    res.send(mip.cmdsSince(id, revision));
  })
);

if (prod) {
  app.use(express.static("./frontend"));
} else {
  const proxyServer = httpProxy.createProxyServer();
  proxyServer.webAsync = promisify(proxyServer.web);
  app.all(
    "/*",
    handleAsyncErrors(async (req, res) => {
      await proxyServer.webAsync(req, res, { target: "http://localhost:3000" });
    })
  );
}

app.use(async (err, req, res, next) => {
  console.error(util.inspect(err, { depth: null, colors: true }));
});

async function main() {
  await mip.initialize(
    `${
      process.env.SCORE_VOTING_DATA_DIR ||
      (prod ? "/var/local/score-voting" : ".")
    }/score-voting.db`
  );
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
}

main();
