import "./App.css";
import React from "react";
import reduce from "./reduce.js";
import * as utils from "./utils.js";

class App extends React.Component {
  constructor(props) {
    super(props);

    // Poor man's router
    const id = window.location.hash.slice(1).toUpperCase() || utils.rndId(32);
    window.location.hash = id;

    this.state = {
      id,
      title: "voting for yada",
      questions: [],
      people: [],
    };
  }

  send(msg) {
    this.setState(reduce(this.state, msg));
  }

  render() {
    return (
      <div className="App">
        <h1>Score voting</h1>
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
  return (
    <div>
      <div>ID: {props.id}</div>
      <div>Title: {props.title}</div>
      <div>
        <table>
          <thead>
            <tr>
              <th>
                People:
                <TextAction
                  caption="Add person"
                  onClick={(name) => props.send({ op: "createperson", name })}
                />
              </th>
              {props.people.map((person) => (
                <th key={person.id}>
                  {person.id}, {person.name}
                  <button
                    onClick={() =>
                      props.send({ op: "deleteperson", id: person.id })
                    }
                  >
                    Delete
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.questions.map((question) => [
              <tr key={question.id}>
                <td>
                  {question.title}
                  <TextAction
                    caption="Add option"
                    onClick={(title) =>
                      props.send({
                        op: "createoption",
                        title,
                        questionid: question.id,
                      })
                    }
                  />
                </td>
              </tr>,
              question.options.map((option) => (
                <OptionRow
                  option={option}
                  people={props.people}
                  send={props.send}
                />
              )),
            ])}
          </tbody>
        </table>
        <TextAction
          caption="Add question"
          onClick={(title) => props.send({ op: "createquestion", title })}
        />
      </div>
    </div>
  );
}

function OptionRow(props) {
  const { option, people, send } = props;
  const votingDone = optionHasAllVotes(option, people);
  return (
    <tr key={option.id}>
      <td> {option.title}</td>
      {people.map((person) => (
        <VoteCell
          option={option}
          person={person}
          votingDone={votingDone}
          send={send}
        />
      ))}
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

class TextAction extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: "" };
  }
  render() {
    return (
      <div>
        <input
          type="text"
          onChange={(e) => this.setState({ value: e.target.value })}
        />
        <button onClick={() => this.props.onClick(this.state.value)}>
          {this.props.caption}
        </button>
      </div>
    );
  }
}

export default App;
