const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const express = require("express");
const httpProxy = require("http-proxy");
const http = require("axios");

const renderApp = require("./renderApp.js").default;
const mip = require("./mip.js");

const PORT = process.env.PORT || 3006;
const app = express();
const expressWs = require("express-ws")(app);

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
  const props = await propsFun(req);
  const app = renderApp(props);
  const template = await getIndexFileContents();
  return res.send(
    template.replace('<div id="root"></div>', `<div id="root">${app}</div>`)
  );
};

async function getModel(id) {
  const document = await mip.getDocument(id);
  return { view: "voting", document };
}

app.use(express.json());

app.get(
  "/d/:id",
  appHandler(async (req) => await getModel(req.params.id))
);

app.get("/modelfor/d/:id", async (req, res) => {
  const ret = await getModel(req.params.id);
  return res.send(ret);
});

app.post("/send/d/:id", async (req, res) => {
  const id = req.params.id;
  const cmd = req.body;
  await mip.send(id, cmd);
  return res.send("ok");
});

app.ws("/realtimecmdsfor/d/:id", async (ws, req) => {
  const id = req.params.id;
  const deliver = (cmd) => ws.send(JSON.stringify(cmd));
  ws.on("close", (code, reason) => mip.off(id, deliver));
  ws.on("error", (error) => ws.close());
  ws.on("message", (data) => mip.on(id, deliver));
  ws.on("open", () => mip.on(id, deliver));
});

app.get("/cmdsfor/d/:id/since/:revision", async (req, res) => {
  const { id, revision } = req.params;
  res.send(mip.cmdsSince(id, revision));
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
