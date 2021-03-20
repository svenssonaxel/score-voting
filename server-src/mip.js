const EventEmitter = require("events");
const reduce = require("../src/reduce.js").default;

const mip = module.exports;

let documents = {};
const eventemitter = new EventEmitter();

mip.getDocument = async function (id) {
  if (!(id in documents)) {
    await mip.send(id, { op: "createdocument", id });
  }
  let d = documents[id];
  while (d.cmd_log.length > d.last_model.revision) {
    let old_revision = d.last_model.revision;
    d.last_model = reduce(d.last_model, d.cmd_log[old_revision]);
    d.last_model.revision = old_revision + 1;
  }
  return d.last_model;
};

mip.send = async function (id, cmd) {
  if (!(id in documents)) {
    documents[id] = { cmd_log: [], last_model: { revision: 0 } };
  }
  const d = documents[id];
  cmd.cmd_index = d.cmd_log.length;
  d.cmd_log.push(cmd);
  eventemitter.emit(id, cmd);
};

mip.on = (id, fun) => eventemitter.on(id, fun);

mip.off = (id, fun) => eventemitter.off(id, fun);

mip.cmdsSince = (id, revision) => {
  if (id in documents) {
    return documents[id].cmd_log.slice(revision);
  }
  return [];
};
