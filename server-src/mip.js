const reduce = require("../src/reduce.js").default;

const mip = module.exports;

let documents = {};

mip.getDocument = async function (id) {
  if (!(id in documents)) {
    await mip.send(id, { op: "createdocument", id });
  }
  let d = documents[id];
  while (d.command_log.length > d.last_model.revision) {
    let old_revision = d.last_model.revision;
    d.last_model = reduce(d.last_model, d.command_log[old_revision]);
    d.last_model.revision = old_revision + 1;
  }
  return d.last_model;
};

mip.send = async function (id, msg) {
  if (!(id in documents)) {
    documents[id] = { command_log: [], last_model: { revision: 0 } };
  }
  documents[id].command_log.push(msg);
};
