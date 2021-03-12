import "./App.css";
import React from "react";
import reduce from "./reduce.js";
import { rndId, PopoverHelper, AddButton, DeleteButton } from "./utils.js";
import { Popover, Slider, Input, Tooltip } from "@material-ui/core";
import * as _ from "lodash";

class App extends React.Component {
  constructor(props) {
    super(props);

    // Poor man's router
    const id = window.location.hash.slice(1).toUpperCase() || rndId(32);
    window.location.hash = id;
    this.state = reduce({}, { op: "createdocument", id });
  }

  send(msg) {
    this.setState(reduce(this.state, msg));
  }

  render() {
    return (
      <div className="App">
        <Voting
          id={this.state.id}
          title={this.state.title}
          description={this.state.description}
          questions={this.state.questions}
          people={this.state.people}
          send={(msg) => this.send(msg)}
        />
      </div>
    );
  }
}

function Voting({ people, title, description, send, questions }) {
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
                  className={`person ${index % 2 ? "oddcol" : "evencol"}`}
                />
              ))}
              <th className="createperson">
                <AddButton
                  tooltip="Add person"
                  fun={() => send({ op: "createperson" })}
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
              />
            ))}
            <tr>
              <td colSpan={numberOfColumns} className="createquestion">
                <AddButton
                  tooltip="Add question"
                  tooltipPlacement="right"
                  fun={() => send({ op: "createquestion" })}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
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

class Editor extends React.Component {
  constructor(props, updateWith, fields = null) {
    super(props);
    this.state = _.cloneDeep(props.object);
    if (fields) {
      this.state = _.pick(this.state, fields);
    }
    this.props.onClose(() => {
      let obj = {};
      for (let attr in this.state) {
        if (this.props.object[attr] !== this.state[attr]) {
          obj[attr] = this.state[attr];
        }
      }
      if (_.size(obj)) {
        this.props.send({ ...updateWith, ...obj });
      }
    });
  }
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

function Question({ question, numberOfColumns, send, people }) {
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
      <OptionRow key={option.id} option={option} people={people} send={send} />
    )),
    <tr key={"addoptionfor_" + question.id}>
      <td></td>
      <td colSpan={numberOfColumns - 2} className="createoption">
        <AddButton
          tooltip="Add option"
          tooltipPlacement="right"
          fun={() =>
            send({
              op: "createoption",
              questionid: question.id,
            })
          }
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

function OptionRow({ option, people, send }) {
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
          className={`vote ${index % 2 ? "oddcol" : "evencol"}`}
          key={person.id}
          option={option}
          person={person}
          votingDone={votingDone}
          send={send}
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

function VoteCell({ option, person, votingDone, send, ...otherProps }) {
  const vote = option.votes[person.id];
  const isCast = Number.isInteger(vote);
  const show = votingDone ? vote : isCast ? "✓" : "✧";
  const popover = PopoverHelper("ne");
  return (
    <td key={person.id} {...otherProps}>
      <div className="vote" {...popover.elementProps}>
        {show}
      </div>
      <Popover {...popover.PopoverProps}>
        <EditVote
          object={{ value: option.votes[person.id] }}
          option={option}
          personId={person.id}
          onClose={popover.onClose}
          send={send}
        />
      </Popover>
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
      <div className="editor">
        <div>Option: {option.title}</div>
        <div>
          Vote:{" "}
          <Slider
            value={Number.isInteger(value) ? value : 0}
            onChange={(e, newValue) => this.updateVote(newValue)}
            marks={[
              //            { label: "Strongly disagree", value: -100 },
              { label: "Neutral", value: 0 },
              //          { label: "Strongly agree", value: 100 },
            ]}
            min={-100}
            max={100}
          />
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
          />
        </div>
      </div>
    );
  }
}

export default App;
