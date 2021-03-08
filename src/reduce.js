const _ = require("lodash");
const { rndId } = require("./utils.js");

const reductions = {
  createperson: (state, msg) => ({
    people: [...state.people, { id: rndId(), name: msg.name }],
  }),
  deleteperson: (state, msg) => ({
    people: _.filter(state.people, (person) => person.id !== msg.id),
    questions: _.map(state.questions, (question) => ({
      ...question,
      options: _.map(question.options, (option) => ({
        ...option,
        votes: _.omit(option.votes, msg.id),
      })),
    })),
  }),

  createquestion: (state, msg) => ({
    questions: [
      ...state.questions,
      { id: rndId(), title: msg.title, options: [] },
    ],
  }),
  deletequestion: (state, msg) => ({
    questions: _.filter(state.questions, (question) => question.id !== msg.id),
  }),

  createoption: (state, msg) => ({
    questions: _.map(state.questions, (question) =>
      question.id === msg.questionid
        ? {
            ...question,
            options: [
              ...question.options,
              {
                id: rndId(),
                questionid: msg.questionid,
                title: msg.title,
                votes: {},
              },
            ],
          }
        : question
    ),
  }),
  deleteoption: (state, msg) => ({
    questions: _.map(state.questions, (question) =>
      question.id === msg.questionid
        ? {
            ...question,
            options: _.filter(
              question.options,
              (option) => option.id !== msg.id
            ),
          }
        : question
    ),
  }),

  vote: (state, msg) => ({
    questions: _.map(state.questions, (question) =>
      question.id === msg.questionid
        ? {
            ...question,
            options: _.map(question.options, (option) =>
              option.id === msg.optionid
                ? {
                    ...option,
                    votes: { ...option.votes, [msg.personid]: msg.value },
                  }
                : option
            ),
          }
        : question
    ),
  }),
};

export default function reduce(state, msg) {
  return reductions[msg.op](state, msg);
}
