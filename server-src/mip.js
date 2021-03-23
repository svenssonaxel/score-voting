const EventEmitter = require("events");
const sqlite = require("sqlite-async");
const assert = require("assert");
const reduce = require("../src/reduce.js").default;

const mip = module.exports;

let documents = {};
const eventemitter = new EventEmitter();
let db;

mip.initialize = async function () {
  db = await sqlite.open("./score-voting.db");
  await db.run(
    "CREATE TABLE IF NOT EXISTS cmds (documentid text, cmd_index int, cmd text, UNIQUE (documentid, cmd_index));"
  );
};

async function saveCmd(id, cmd_index, cmd) {
  assert(cmd_index === cmd.cmd_index);
  assert(Number.isInteger(cmd_index));
  assert(0 <= cmd_index);
  const cmd_serialized = JSON.stringify(cmd);
  if (0 < cmd_index) {
    const lastRecord = await db.get(
      "SELECT * FROM cmds WHERE documentid=? and cmd_index=?",
      id,
      cmd_index - 1
    );
    assert(lastRecord);
  }
  await db.run(
    "INSERT INTO cmds VALUES (?, ?, ?)",
    id,
    cmd_index,
    cmd_serialized
  );
}

async function loadCmds(id, startingat = 0) {
  const data = await db.all(
    "SELECT * FROM cmds WHERE documentid=? and ?<=cmd_index",
    id,
    startingat
  );
  const ret = [];
  data.forEach(({ documentid, cmd_index, cmd }, index) => {
    const cmd_obj = JSON.parse(cmd);
    console.log({ documentid, cmd_index, cmd, cmd_obj, startingat, index });
    assert(cmd_index === startingat + index);
    assert(cmd_index === cmd_obj.cmd_index);
    ret.push(cmd_obj);
  });
  return ret;
}

async function updateDocument(id) {
  if (!(id in documents)) {
    const cmd_log = await loadCmds(id);
    if (cmd_log.length) {
      assert(!(id in documents));
      documents[id] = { cmd_log, last_model: { revision: 0 } };
    } else {
      await saveCmd(id, 0, { op: "createdocument", id, cmd_index: 0 });
      return await updateDocument(id);
    }
  } else {
    const d = documents[id];
    const len = d.cmd_log.length;
    const add_to_cmd_log = await loadCmds(id, len);
    assert(len === d.cmd_log.length);
    d.cmd_log.push(...add_to_cmd_log);
  }
}

mip.getDocument = async function (id) {
  await updateDocument(id);
  const d = documents[id];
  while (d.last_model.revision < d.cmd_log.length) {
    let old_revision = d.last_model.revision;
    const last_model = reduce(d.last_model, d.cmd_log[old_revision]);
    assert(last_model.revision === old_revision + 1);
    d.last_model = last_model;
  }
  return d.last_model;
};

mip.send = async function (id, cmd) {
  await saveCmd(id, cmd.cmd_index, cmd);
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
