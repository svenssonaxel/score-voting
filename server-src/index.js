const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const express = require("express");
const httpProxy = require("http-proxy");
const http = require("axios");

const reduce = require("../src/reduce.js").default;
const renderApp = require("./renderApp.js").default;

const PORT = process.env.PORT || 3006;
const app = express();

const prod = process.env.NODE_ENV == "production";

async function getIndexFileContents() {
  if (prod) {
    const readFile = promisify(fs.readFile);
    const indexFile = path.resolve("./build/index.html");
    const data = await readFile(indexFile, "utf8");
    return data;
  } else {
    const response = await http.get("http://localhost:3000/index.html");
    return response.data;
  }
}

const appHandler = (propsFun) => async (req, res) => {
  const props = propsFun(req);
  const app = renderApp(props);
  const template = await getIndexFileContents();
  return res.send(
    template.replace('<div id="root"></div>', `<div id="root">${app}</div>`)
  );
};

function getDocument(id) {
  const document = reduce({}, { op: "createdocument", id });
  const send = (msg) =>
    console.log({ error: "Cannot send before hydration", msg });
  return {
    view: "voting",
    document,
    send,
  };
}

app.get(
  "/d/:id",
  appHandler((req) => getDocument(req.params.id))
);

app.get("/modelfor/d/:id", (req, res) => {
  const ret = getDocument(req.params.id);
  return res.send(ret);
});

if (prod) {
  app.use(express.static("./build"));
} else {
  const proxyServer = httpProxy.createProxyServer();
  app.all("/*", (req, res) =>
    proxyServer.web(req, res, { target: "http://localhost:3000" })
  );
}

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
