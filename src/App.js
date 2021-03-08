import "./App.css";
import React from "react";
import reduce from "./reduce.js";
import * as utils from "./utils.js";
import { Fab, Tooltip } from "@material-ui/core";
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
  const numberOfColumns = props.people.length + 3;
  return (
    <div>
      <h1>{props.title}</h1>
      <div>
        <table>
          <colgroup>
            <col width="30em" />
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
              {props.people.map((person) => (
                <th key={person.id} valign="top">
                  <div className="person">{person.name}</div>
                </th>
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

function Question(props) {
  return [
    <tr key={props.question.id}>
      <td colSpan={props.numberOfColumns} className="question">
        {props.question.title}
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

function OptionRow(props) {
  const { option, people, send } = props;
  const votingDone = optionHasAllVotes(option, people);
  return (
    <tr key={option.id}>
      <td></td>
      <td className="option"> {option.title}</td>
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

function VoteCell(props) {
  const { option, person, votingDone } = props;
  const vote = option.votes[person.id];
  const isCast = Number.isInteger(vote);
  const show = votingDone ? vote : isCast ? "✓" : "✧";
  return (
    <td
      className="vote"
      key={person.id}
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
      {show}
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
