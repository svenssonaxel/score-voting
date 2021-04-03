import React from "react";

export function Firstpage({ newDocumentPath, ssr }) {
  let createSection;
  if (!ssr && newDocumentPath) {
    createSection = (
      <div key="createsection">
        Create a <a href={newDocumentPath}>new score vote</a>
      </div>
    );
  } else {
    createSection = (
      <div key="createsection">
        <noscript>
          In order to create a new score vote, you need to enable Javascript.
        </noscript>
      </div>
    );
  }
  return (
    <div>
      <h1>Score voting</h1>
      {createSection}
    </div>
  );
}
