import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./App.css";
import App from "./App";
import * as http from "axios";

async function main() {
  const path = window.location.pathname;
  const modelResponse = await http.get(`/modelfor${path}`);
  const model = modelResponse.data;
  ReactDOM.hydrate(
    <React.StrictMode>
      <App {...model} path={path} />
    </React.StrictMode>,
    document.getElementById("root")
  );
}

main();
