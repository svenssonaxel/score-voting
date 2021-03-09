import "./App.css";
import React from "react";
import reduce from "./reduce.js";
import * as utils from "./utils.js";
import { Button, Fab, Tooltip, Popover } from "@material-ui/core";
import { Add } from "@material-ui/icons";

class App extends React.Component {
  constructor(props) {
    super(props);

    // Poor man's router
    const id = window.location.hash.slice(1).toUpperCase() || utils.rndId(32);
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
          questions={this.state.questions}
          people={this.state.people}
          send={(msg) => this.send(msg)}
        />
      </div>
    );
  }
}

function Voting({ people, title, send, questions }) {
  const numberOfColumns = people.length + 4;
  return (
    <div>
      <h1>{title}</h1>
      <div>
        <table>
          <colgroup>
            <col />
            <col />
            <col />
            {people.map((person) => (
              <col key={person.id} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th valign="top">
                <div className="questions">Questions</div>
              </th>
              <th valign="top">
                <div className="options">Options</div>
              </th>
              <th valign="top">
                <div className="results">Results</div>
              </th>
              {people.map((person) => (
                <Person key={person.id} person={person} send={send} />
              ))}
              <th valign="top">
                <IconButton
                  tooltip="Add person"
                  onClick={() => send({ op: "createperson" })}
                >
                  <Add />
                </IconButton>
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
                <IconButton
                  tooltip="Add question"
                  onClick={() => send({ op: "createquestion" })}
                >
                  <Add />
                </IconButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Person({ person, send }) {
  const pPopover = utils.PopoverHelper("ne");
  return (
    <th key={person.id} valign="top">
      <div className="person" {...pPopover.elementProps}>
        {person.name}
      </div>
      <Popover {...pPopover.PopoverProps}>
        <EditPerson person={person} send={send} />
      </Popover>
    </th>
  );
}

function EditPerson({ person, send }) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this person?",
    text: person.name,
    fun: () => {
      send({
        op: "deleteperson",
        id: person.id,
      });
    },
  });
  return (
    <div>
      <div>Name: {person.name}</div>
      <div>
        <Button {...qDelete.elementProps}>Delete</Button>
        {qDelete.dialog}
      </div>
    </div>
  );
}

function Question({ question, numberOfColumns, send, people }) {
  const qPopover = utils.PopoverHelper("nw");
  return [
    <tr key={question.id}>
      <td colSpan={numberOfColumns} className="question">
        <div {...qPopover.elementProps}>{question.title}</div>
        <Popover {...qPopover.PopoverProps}>
          <EditQuestion question={question} send={send} />
        </Popover>
      </td>
    </tr>,
    ...question.options.map((option) => (
      <OptionRow key={option.id} option={option} people={people} send={send} />
    )),
    <tr key={"addoptionfor_" + question.id}>
      <td></td>
      <td colSpan={numberOfColumns - 1} className="createoption">
        <IconButton
          tooltip="Add option"
          onClick={() =>
            send({
              op: "createoption",
              questionid: question.id,
            })
          }
        >
          <Add />
        </IconButton>
      </td>
    </tr>,
  ];
}

function EditQuestion({ question, send }) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this question?",
    text: question.title,
    fun: () => {
      send({
        op: "deletequestion",
        id: question.id,
      });
    },
  });
  return (
    <div>
      <div>Title: {question.title}</div>
      <div>
        <Button {...qDelete.elementProps}>Delete</Button>
        {qDelete.dialog}
      </div>
    </div>
  );
}

function OptionRow({ option, people, send }) {
  const votingDone = optionHasAllVotes(option, people);
  const result = votingDone ? calculateResult(option, people).toFixed(2) : "";
  const oPopover = utils.PopoverHelper("nw");
  return (
    <tr key={option.id}>
      <td></td>
      <td className="option">
        <div {...oPopover.elementProps}>{option.title}</div>
        <Popover {...oPopover.PopoverProps}>
          <EditOption option={option} send={send} />
        </Popover>
      </td>
      <td className="result">{result}</td>
      {people.map((person) => (
        <VoteCell
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

function EditOption({ option, send }) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this option?",
    text: option.title,
    fun: () => {
      send({
        op: "deleteoption",
        id: option.id,
        questionid: option.questionid,
      });
    },
  });
  return (
    <div>
      <div>Title: {option.title}</div>
      <div>
        <Button {...qDelete.elementProps}>Delete</Button>
        {qDelete.dialog}
      </div>
    </div>
  );
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

function VoteCell({ option, person, votingDone, send }) {
  const vote = option.votes[person.id];
  const isCast = Number.isInteger(vote);
  const show = votingDone ? vote : isCast ? "✓" : "✧";
  const votePopover = utils.PopoverHelper("ne");
  return (
    <td key={person.id}>
      <div className="vote" {...votePopover.elementProps}>
        {show}
      </div>
      <Popover {...votePopover.PopoverProps}>
        <Button
          onClick={() =>
            send({
              op: "vote",
              questionid: option.questionid,
              optionid: option.id,
              personid: person.id,
              value: 1 + (option.votes[person.id] || 0),
            })
          }
        >
          inc
        </Button>
      </Popover>
    </td>
  );
}

function IconButton({ tooltip, ...buttonprops }) {
  return (
    <Tooltip title={tooltip}>
      <Fab color="primary" size="small" {...buttonprops}></Fab>
    </Tooltip>
  );
}

export default App;
