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

function Voting(props) {
  const numberOfColumns = props.people.length + 4;
  return (
    <div>
      <h1>{props.title}</h1>
      <div>
        <table>
          <colgroup>
            <col />
            <col />
            <col />
            {props.people.map((person) => (
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
              {props.people.map((person) => (
                <Person key={person.id} person={person} send={props.send} />
              ))}
              <th valign="top">
                <IconButton
                  tooltip="Add person"
                  onClick={() => props.send({ op: "createperson" })}
                >
                  <Add />
                </IconButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {props.questions.map((question) => (
              <Question
                key={question.id}
                question={question}
                numberOfColumns={numberOfColumns}
                people={props.people}
                send={props.send}
              />
            ))}
            <tr>
              <td colSpan={numberOfColumns} className="createquestion">
                <IconButton
                  tooltip="Add question"
                  onClick={() => props.send({ op: "createquestion" })}
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

function Person(props) {
  const pPopover = utils.PopoverHelper("ne");
  return (
    <th key={props.person.id} valign="top">
      <div className="person" {...pPopover.elementProps}>
        {props.person.name}
      </div>
      <Popover {...pPopover.PopoverProps}>
        <EditPerson person={props.person} send={props.send} />
      </Popover>
    </th>
  );
}

function EditPerson(props) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this person?",
    text: props.person.name,
    fun: () => {
      props.send({
        op: "deleteperson",
        id: props.person.id,
      });
    },
  });
  return (
    <div>
      <div>Name: {props.person.name}</div>
      <div>
        <Button {...qDelete.elementProps}>Delete</Button>
        {qDelete.dialog}
      </div>
    </div>
  );
}

function Question(props) {
  const qPopover = utils.PopoverHelper("nw");
  return [
    <tr key={props.question.id}>
      <td colSpan={props.numberOfColumns} className="question">
        <div {...qPopover.elementProps}>{props.question.title}</div>
        <Popover {...qPopover.PopoverProps}>
          <EditQuestion question={props.question} send={props.send} />
        </Popover>
      </td>
    </tr>,
    ...props.question.options.map((option) => (
      <OptionRow
        key={option.id}
        option={option}
        people={props.people}
        send={props.send}
      />
    )),
    <tr key={"addoptionfor_" + props.question.id}>
      <td></td>
      <td colSpan={props.numberOfColumns - 1} className="createoption">
        <IconButton
          tooltip="Add option"
          onClick={() =>
            props.send({
              op: "createoption",
              questionid: props.question.id,
            })
          }
        >
          <Add />
        </IconButton>
      </td>
    </tr>,
  ];
}

function EditQuestion(props) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this question?",
    text: props.question.title,
    fun: () => {
      props.send({
        op: "deletequestion",
        id: props.question.id,
      });
    },
  });
  return (
    <div>
      <div>Title: {props.question.title}</div>
      <div>
        <Button {...qDelete.elementProps}>Delete</Button>
        {qDelete.dialog}
      </div>
    </div>
  );
}

function OptionRow(props) {
  const { option, people, send } = props;
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

function EditOption(props) {
  const qDelete = utils.ConfirmHelper({
    title: "Delete this option?",
    text: props.option.title,
    fun: () => {
      props.send({
        op: "deleteoption",
        id: props.option.id,
        questionid: props.option.questionid,
      });
    },
  });
  return (
    <div>
      <div>Title: {props.option.title}</div>
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

function VoteCell(props) {
  const { option, person, votingDone } = props;
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
            props.send({
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

function IconButton(props) {
  const { tooltip, ...buttonprops } = props;
  return (
    <Tooltip title={tooltip}>
      <Fab color="primary" size="small" {...buttonprops}></Fab>
    </Tooltip>
  );
}

export default App;
