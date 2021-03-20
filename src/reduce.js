const _ = require("lodash");

const reductions = {
  createdocument(state, cmd) {
    let ret = {
      id: cmd.id,
      title: "Title for score voting",
      description: "",
      questions: [],
      people: [],
      nextid: 1,
    };
    ret = reduce(ret, { op: "createperson" });
    ret = reduce(ret, { op: "createperson" });
    ret = reduce(ret, { op: "createquestion" });
    return ret;
  },
  updatedocument: (state, cmd) => _.pick(cmd, ["title", "description"]),

  createperson: (state, cmd) => ({
    people: [
      ...state.people,
      {
        id: state.nextid,
        name: cmd.name || "Person " + (state.people.length + 1),
        weight: cmd.weight || 1,
      },
    ],
    nextid: state.nextid + 1,
  }),
  updateperson: (state, cmd) => ({
    people: _.map(state.people, (person) =>
      person.id === cmd.id
        ? { ...person, ..._.pick(cmd, ["name", "weight"]) }
        : person
    ),
  }),
  deleteperson: (state, cmd) => ({
    people: _.filter(state.people, (person) => person.id !== cmd.id),
    questions: _.map(state.questions, (question) => ({
      ...question,
      options: _.map(question.options, (option) => ({
        ...option,
        votes: _.omit(option.votes, cmd.id),
      })),
    })),
  }),

  createquestion(state, cmd) {
    const id = state.nextid;
    let ret = {
      ...state,
      questions: [
        ...state.questions,
        {
          id,
          title: cmd.title || "Question " + (state.questions.length + 1),
          description: cmd.description || "",
          options: [],
        },
      ],
      nextid: state.nextid + 1,
    };
    ret = reduce(ret, { op: "createoption", questionid: id });
    ret = reduce(ret, { op: "createoption", questionid: id });
    return ret;
  },
  updatequestion: (state, cmd) => ({
    questions: _.map(state.questions, (question) =>
      question.id === cmd.id
        ? { ...question, ..._.pick(cmd, ["title", "description"]) }
        : question
    ),
  }),
  deletequestion: (state, cmd) => ({
    questions: _.filter(state.questions, (question) => question.id !== cmd.id),
  }),

  createoption: (state, cmd) => ({
    questions: _.map(state.questions, (question) =>
      question.id === cmd.questionid
        ? {
            ...question,
            options: [
              ...question.options,
              {
                id: state.nextid,
                questionid: cmd.questionid,
                title: cmd.title || "Option " + (question.options.length + 1),
                description: cmd.description || "",
                votes: {},
              },
            ],
          }
        : question
    ),
    nextid: state.nextid + 1,
  }),
  updateoption: (state, cmd) => ({
    questions: _.map(state.questions, (question) =>
      question.id === cmd.questionid
        ? {
            ...question,
            options: _.map(question.options, (option) =>
              option.id === cmd.id
                ? { ...option, ..._.pick(cmd, ["title", "description"]) }
                : option
            ),
          }
        : question
    ),
  }),
  deleteoption: (state, cmd) => ({
    questions: _.map(state.questions, (question) =>
      question.id === cmd.questionid
        ? {
            ...question,
            options: _.filter(
              question.options,
              (option) => option.id !== cmd.id
            ),
          }
        : question
    ),
  }),

  vote: (state, cmd) => ({
    questions: _.map(state.questions, (question) =>
      question.id === cmd.questionid
        ? {
            ...question,
            options: _.map(question.options, (option) =>
              option.id === cmd.optionid
                ? {
                    ...option,
                    votes: { ...option.votes, [cmd.personid]: cmd.value },
                  }
                : option
            ),
          }
        : question
    ),
  }),
};

export default function reduce(state, cmd) {
  const oldrevision = state.revision || 0;
  const cmd_index = cmd.cmd_index;
  if (oldrevision !== cmd_index && !_.isUndefined(cmd_index)) {
    throw Error("Attempting to apply out of sync");
  }
  const ret = {
    ...state,
    ...reductions[cmd.op](state, cmd),
    revision: oldrevision + 1,
  };
  return ret;
}
