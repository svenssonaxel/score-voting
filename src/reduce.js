const _ = require("lodash");
const { rndId } = require("./utils.js");

const reductions = {
  createdocument(state, msg) {
    let ret = {
      id: msg.id,
      title: "Title for score voting",
      questions: [],
      people: [],
    };
    ret = reduce(ret, { op: "createperson" });
    ret = reduce(ret, { op: "createperson" });
    ret = reduce(ret, { op: "createquestion" });
    return ret;
  },

  createperson: (state, msg) => ({
    people: [
      ...state.people,
      { id: rndId(), name: msg.name || "Person " + (state.people.length + 1) },
    ],
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

  createquestion(state, msg) {
    const id = rndId();
    let ret = {
      questions: [
        ...state.questions,
        {
          id,
          title: msg.title || "Question " + (state.questions.length + 1),
          options: [],
        },
      ],
    };
    ret = reduce(ret, { op: "createoption", questionid: id });
    ret = reduce(ret, { op: "createoption", questionid: id });
    return ret;
  },
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
                title: msg.title || "Option " + (question.options.length + 1),
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
  return { ...state, ...reductions[msg.op](state, msg) };
}
