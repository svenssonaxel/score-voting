import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "../src/App";

export default function renderApp(props) {
  return ReactDOMServer.renderToString(<App {...props} />);
}
