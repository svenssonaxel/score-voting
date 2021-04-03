import React from "react";
import { PopoverHelper, AddButton, DeleteButton, Editor } from "./utils.js";
import { Popover, Slider, Input, Tooltip, Button } from "@material-ui/core";
import * as http from "axios";
import * as _ from "lodash";

import reduce from "./reduce.js";
import { sleep } from "./utils.js";
import { Firstpage } from "./firstpage.js";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.setStateAsync = (arg) =>
      new Promise((resolve, reject) => {
        this.setState(arg, () => resolve());
      });
    // In order to appease ReactDOM.hydrate, first render in server-side mode. This is updated in componentDidMount.
    this.state = { ...props, me: null, ssr: true };
    this.receiveCache = {};
  }

  componentDidMount() {
    // If running client-side
    if (!this.props.ssr) {
      // Then subscribe to updates if applicable,
      if (this.props.view === "document") {
        this.subscribe();
      }
      this.setState({
        // render subjectively,
        me: JSON.parse(
          window.localStorage.getItem(`me${this.props.path}`) || "null"
        ),
        // and render in client-side mode
        ssr: false,
      });
    }
  }

  async subscribe() {
    const uri = `${window.location.origin.replace(
      /^http/,
      "ws"
    )}/realtimecmdsfor${this.props.path}`;
    const ws = new WebSocket(uri);
    let catchupLoop = true;
    const retry = _.once(() => {
      ws.close();
      catchupLoop = false;
      this.subscribe();
    });
    ws.onclose = () => retry();
    ws.onerror = () => retry();
    ws.onmessage = (event) => this.receive(JSON.parse(event.data));
    ws.onopen = (event) => ws.send(JSON.stringify(true));
    while (catchupLoop) {
      const catchupResponse = await http.get(
        `/cmdsfor${this.props.path}/since/${this.state.document.revision}`
      );
      const data = catchupResponse.data;
      for (let cmd of data) {
        await this.receive(cmd);
      }
      await sleep(5000);
    }
  }

  async receive(cmd) {
    const cmd_index = cmd.cmd_index;
    if (this.state.document.revision <= cmd_index) {
      this.receiveCache[cmd_index] = cmd;
    }
    while (this.state.document.revision in this.receiveCache) {
      await this.setStateAsync({
        document: reduce(
          this.state.document,
          this.receiveCache[this.state.document.revision]
        ),
      });
      delete this.receiveCache[this.state.document.revision];
    }
  }

  async send(cmd) {
    if (!("cmd_index" in cmd)) {
      cmd.cmd_index = this.state.document.revision;
    }
    const cmdResponse = await http.post(`/send${this.props.path}`, cmd);
    const data = cmdResponse.data;
    if (data !== "ok") {
      throw new Error(JSON.stringify(data));
    }
  }

  setMe(key) {
    this.setState({ me: key });
    window.localStorage.setItem(`me${this.props.path}`, JSON.stringify(key));
  }

  render() {
    const { view } = this.props;
    const { newDocumentPath, ssr } = this.state;
    if (view === "firstpage") {
      return (
        <div className="App">
          <Firstpage newDocumentPath={newDocumentPath} ssr={ssr} />
        </div>
      );
    }
    if (view === "document") {
      const { document, me, ssr } = this.state;
      return (
        <div className="App">
          <Voting
            id={document.id}
            title={document.title}
            description={document.description}
            questions={document.questions}
            people={document.people}
            send={(cmd) => this.send(cmd)}
            setMe={(key) => this.setMe(key)}
            me={me}
            ssr={ssr}
          />
        </div>
      );
    }
  }
}

function Voting({
  people,
  title,
  description,
  send,
  setMe,
  me,
  questions,
  ssr,
}) {
  const numberOfColumns = people.length + 4;
  const popover = PopoverHelper("n");
  return (
    <div>
      <Tooltip title={description}>
        <h1 {...popover.elementProps}>{title}</h1>
      </Tooltip>
      <Popover {...popover.PopoverProps}>
        <EditDocument
          object={{ title, description }}
          onClose={popover.onClose}
          send={send}
        />
      </Popover>
      <div>
        <table>
          <thead>
            <tr>
              <th className="question">
                <div>Questions</div>
              </th>
              <th className="option">
                <div>Options</div>
              </th>
              <th className="result">
                <div>Results</div>
              </th>
              {people.map((person, index) => (
                <Person
                  key={person.id}
                  person={person}
                  send={send}
                  className={`person ${index % 2 ? "oddcol" : "evencol"} ${
                    me === person.id ? "me" : ""
                  }`}
                />
              ))}
              <th className="createperson">
                <AddButton
                  tooltip="Add person"
                  fun={() => send({ op: "createperson" })}
                  ssr={ssr}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <Question
                key={question.id}
                question={question}
                numberOfColumns={numberOfColumns}
                people={people}
                send={send}
                setMe={setMe}
                me={me}
                ssr={ssr}
              />
            ))}
            <tr>
              <td colSpan={numberOfColumns} className="createquestion">
                <AddButton
                  tooltip="Add question"
                  tooltipPlacement="right"
                  fun={() => send({ op: "createquestion" })}
                  ssr={ssr}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

class EditDocument extends Editor {
  constructor(props) {
    super(props, { op: "updatedocument" }, ["title", "description"]);
  }
  render() {
    const { title, description } = this.state;
    return (
      <div className="editor">
        <div>
          Title:
          <Input
            value={title}
            onChange={(e) => this.setState({ title: e.target.value })}
          />
        </div>
        <div>
          Description:
          <Input
            multiline
            value={description}
            onChange={(e) => this.setState({ description: e.target.value })}
          />
        </div>
      </div>
    );
  }
}

function Person({ person, send, ...otherProps }) {
  const popover = PopoverHelper("ne");
  return (
    <th key={person.id} {...otherProps}>
      <div {...popover.elementProps}>{person.name}</div>
      <Popover {...popover.PopoverProps}>
        <EditPerson object={person} onClose={popover.onClose} send={send} />
      </Popover>
    </th>
  );
}

class EditPerson extends Editor {
  constructor(props) {
    super(props, { op: "updateperson", id: props.object.id }, [
      "name",
      "weight",
    ]);
  }
  render() {
    const { send } = this.props;
    const { id } = this.props.object;
    const { name, weight } = this.state;
    return (
      <div className="editor">
        <div>
          Name:
          <Input
            value={name}
            onChange={(e) => this.setState({ name: e.target.value })}
          />
        </div>
        <div>
          Weight:
          <Input
            value={weight}
            onChange={(e) =>
              this.setState({ weight: Number.parseInt(e.target.value) })
            }
            inputProps={{ type: "number" }}
          />
        </div>
        <div>
          <DeleteButton
            title="Delete this person?"
            text={name}
            tooltip="Delete person"
            fun={() => {
              send({
                op: "deleteperson",
                id,
              });
            }}
          />
        </div>
      </div>
    );
  }
}

function Question({ question, numberOfColumns, send, people, setMe, me, ssr }) {
  const popover = PopoverHelper("nw");
  return [
    <tr key={question.id}>
      <td colSpan={numberOfColumns - 1} className="question">
        <div {...popover.elementProps}>
          <Tooltip title={question.description} placement="right-start">
            <span>{question.title}</span>
          </Tooltip>
        </div>
        <Popover {...popover.PopoverProps}>
          <EditQuestion
            object={question}
            onClose={popover.onClose}
            send={send}
          />
        </Popover>
      </td>
      <td></td>
    </tr>,
    ...question.options.map((option) => (
      <OptionRow
        key={option.id}
        option={option}
        people={people}
        send={send}
        setMe={setMe}
        me={me}
      />
    )),
    <tr key={"addoptionfor_" + question.id}>
      <td></td>
      <td colSpan={numberOfColumns - 2} className="createoption">
        <AddButton
          tooltip={`Add option to question "${question.title}"`}
          tooltipPlacement="right"
          fun={() =>
            send({
              op: "createoption",
              questionid: question.id,
            })
          }
          ssr={ssr}
        />
      </td>
      <td></td>
    </tr>,
  ];
}

class EditQuestion extends Editor {
  constructor(props) {
    super(props, { op: "updatequestion", id: props.object.id }, [
      "title",
      "description",
    ]);
  }
  render() {
    const { send } = this.props;
    const { id } = this.props.object;
    const { title, description } = this.state;
    return (
      <div className="editor">
        <div>
          Title:
          <Input
            value={title}
            onChange={(e) => this.setState({ title: e.target.value })}
          />
        </div>{" "}
        <div>
          Description:
          <Input
            multiline
            value={description}
            onChange={(e) => this.setState({ description: e.target.value })}
          />
        </div>
        <div>
          <DeleteButton
            title="Delete this question?"
            text={title}
            tooltip="Delete question"
            fun={() => {
              send({
                op: "deletequestion",
                id,
              });
            }}
          />
        </div>
      </div>
    );
  }
}

function OptionRow({ option, people, send, setMe, me }) {
  const votingDone = optionHasAllVotes(option, people);
  const result = votingDone ? calculateResult(option, people).toFixed(2) : "";
  const popover = PopoverHelper("nw");
  return (
    <tr key={option.id}>
      <td></td>
      <td className="option">
        <Tooltip title={option.description} placement="right-start">
          <div {...popover.elementProps}>{option.title}</div>
        </Tooltip>
        <Popover {...popover.PopoverProps}>
          <EditOption object={option} onClose={popover.onClose} send={send} />
        </Popover>
      </td>
      <td className="result">{result}</td>
      {people.map((person, index) => (
        <VoteCell
          className={`vote ${index % 2 ? "oddcol" : "evencol"} ${
            me === person.id ? "me" : ""
          }`}
          key={person.id}
          option={option}
          person={person}
          votingDone={votingDone}
          send={send}
          setMe={setMe}
          me={me}
        />
      ))}
      <td></td>
    </tr>
  );
}

class EditOption extends Editor {
  constructor(props) {
    super(
      props,
      {
        op: "updateoption",
        id: props.object.id,
        questionid: props.object.questionid,
      },
      ["title", "description"]
    );
  }
  render() {
    const { send } = this.props;
    const { id, questionid } = this.props.object;
    const { title, description } = this.state;
    return (
      <div className="editor">
        <div>
          Title:
          <Input
            value={title}
            onChange={(e) => this.setState({ title: e.target.value })}
          />
        </div>
        <div>
          Description:
          <Input
            multiline
            value={description}
            onChange={(e) => this.setState({ description: e.target.value })}
          />
        </div>
        <div>
          <DeleteButton
            title="Delete this option?"
            text={title}
            tooltip="Delete option"
            fun={() => {
              send({
                op: "deleteoption",
                id,
                questionid,
              });
            }}
          />
        </div>
      </div>
    );
  }
}

function optionHasAllVotes(option, people) {
  const votes = option.votes;
  for (let person of people) {
    if (!(person.id in votes)) {
      return false;
    }
    if (!Number.isInteger(votes[person.id])) {
      return false;
    }
  }
  return true;
}

function calculateResult(option, people) {
  let votes = 0,
    weight = 0;
  for (let person of people) {
    votes += option.votes[person.id] * person.weight;
    weight += person.weight;
  }
  return votes / weight;
}

function VoteCell({
  option,
  person,
  votingDone,
  send,
  setMe,
  me,
  ...otherProps
}) {
  const vote = option.votes[person.id];
  const isCast = Number.isInteger(vote);
  const thisIsMe = person.id === me;
  let show = "__",
    popoverContent;
  if (votingDone || thisIsMe) {
    show = vote || "__";
  } else if (isCast) {
    show = "▓";
  }
  const popover = PopoverHelper("ne");
  if (thisIsMe) {
    popoverContent = (
      <EditVote
        object={{ value: option.votes[person.id] }}
        option={option}
        personId={person.id}
        onClose={popover.onClose}
        send={send}
      />
    );
  } else {
    popoverContent = <NotMe person={person} setMe={setMe} me={me} />;
  }
  return (
    <td key={person.id} {...otherProps}>
      <div
        className={`vote ${thisIsMe ? "me" : ""} ${
          isCast ? "iscast" : "isnotcast"
        }`}
        {...popover.elementProps}
      >
        {show}
      </div>
      <Popover {...popover.PopoverProps}>{popoverContent}</Popover>
    </td>
  );
}

class EditVote extends Editor {
  constructor(props) {
    super(
      props,
      {
        op: "vote",
        questionid: props.option.questionid,
        optionid: props.option.id,
        personid: props.personId,
      },
      ["value"]
    );
  }
  interpretVote(v) {
    if ("" + v === "" + Number.parseInt(v)) {
      v = Number.parseInt(v);
    }
    if (Number.isInteger(v)) {
      if (v < -100) {
        v = -100;
      }
      if (100 < v) {
        v = 100;
      }
    } else {
      v = null;
    }
    return v;
  }
  updateVote(vote) {
    this.setState({ value: this.interpretVote(vote) });
  }
  render() {
    const { option } = this.props;
    const { value } = this.state;
    return (
      <div className="editor voteRoot">
        <div>Vote for option: {option.title}</div>
        <div className="voteInput">
          <Input
            value={value === null || value === undefined ? "" : value}
            margin="dense"
            onChange={(e) => this.updateVote(e.target.value)}
            inputProps={{
              step: 1,
              min: -100,
              max: 100,
              type: "number",
            }}
            classes={{ input: "voteInputbox" }}
          />
        </div>
        <div className="voteSlider">
          <Slider
            value={Number.isInteger(value) ? value : 0}
            onChange={(e, newValue) => this.updateVote(newValue)}
            marks={[
              { label: "Strongly disagree", value: -100 },
              { label: "Disagree", value: -50 },
              { label: "Neutral", value: 0 },
              { label: "Agree", value: 50 },
              { label: "Strongly agree", value: 100 },
            ]}
            min={-100}
            max={100}
            track={false}
            classes={{ markLabel: "voteMark" }}
          />
        </div>
      </div>
    );
  }
}

function NotMe({ person, setMe, me }) {
  const name = person.name;
  if (person.id !== me) {
    return (
      <div className="editor">
        <div>
          You cannot vote as <b>{name}</b> unless you are <b>{name}</b>.
        </div>
        <div>
          Are you <b>{name}</b>?
        </div>
        <Button color="primary" onClick={() => setMe(person.id)}>
          Yes
        </Button>
      </div>
    );
  }
}

export default App;
