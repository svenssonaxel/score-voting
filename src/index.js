import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "./App.css";
import App from "./App";
import * as http from "axios";

function send(msg) {
  console.log({ msg });
}

async function main() {
  const path = window.location.pathname;
  const modelResponse = await http.get(`/modelfor${path}`);
  const model = modelResponse.data;
  ReactDOM.hydrate(
    <React.StrictMode>
      <App {...model} send={send} />
    </React.StrictMode>,
    document.getElementById("root")
  );
}

main();
