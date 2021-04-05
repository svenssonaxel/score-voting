import React from "react";
import { Button } from "@material-ui/core";

export function Firstpage({ newDocumentPath, ssr }) {
  let createSection;
  if (!ssr && newDocumentPath) {
    createSection = (
      <div key="createsection">
        To get started, click here:
        <Button
          color="primary"
          onClick={() => {
            window.location.pathname = newDocumentPath;
          }}
        >
          new score vote
        </Button>
      </div>
    );
  } else {
    createSection = (
      <div key="createsection">
        <noscript>
          In order to create a new score vote, you need to enable Javascript.
        </noscript>
      </div>
    );
  }
  return (
    <div>
      <h1>Score voting</h1>
      {createSection}
      <h2>What is score voting and why is it good?</h2>
      <figure>
        <img
          alt=""
          src="/comparing_voting_methods_simplicity_group_satisfaction.png"
        />
        <figcaption>
          Different voting systems, compared by their resulting group
          satisfaction and ease of use.{" "}
          <a
            target="_blank"
            href="https://electionscience.org/library/approval-voting-versus-irv/"
          >
            Source
          </a>
        </figcaption>
      </figure>
      <p>
        There are many different voting systems. The most common system is that
        you get one vote, and cast it for one of the options. This is called{" "}
        <em>Plurality Voting</em>, and in the diagram above you see that it's
        almost as bad as it gets. Why? So many problems, but in summary too much
        power is given to whomever formulates the options, and too little
        information is extracted from the voters.{" "}
        <a
          target="_blank"
          href="https://electionscience.org/voting-methods/spoiler-effect-top-5-ways-plurality-voting-fails/"
        >
          Read more here.
        </a>
      </p>
      <p>
        If you are part of a decision making group smaller than a country and
        have a genuine interest to make good decisions, choose a better voting
        method. With <em>Score Voting</em>, each voter gets to express their
        view of each option and with more nuance than just Yes or No. Score
        Voting with honest voters is hard to beat. With strategic (dishonest)
        voters, score voting will regress into approval voting, which isn&apos;t
        too bad either.
      </p>
      <h2>How does it work?</h2>
      <p>
        This implementation of score voting has a few quirks designed to change
        the dynamic of group decision making. The idea is to combine discussion
        and voting into an organic, creative process. It works best with
        smallish groups that can discuss and vote at the same time.
      </p>
      <ul>
        <li>
          Anyone can add options, even in the middle of the voting process.
          After all, why assume that the best options are always invented before
          voting starts?
        </li>
        <li>
          When everyone has voted for a certain option, the result for that
          option is made public, even if other options for the same questions
          are not done yet.
        </li>
        <li>
          Anyone can change their vote even after the result for that option is
          public.
        </li>
        <li>
          Anyone can add separate questions that become part of the same
          decision making process. After all, it is common to discover in the
          middle of a discussion that you&apos;re really talking about several
          separate but interdependent questions.
        </li>
      </ul>
      <p>
        One powerful implication of this system is that it opens up for
        meta-decisions. You can add options such as "postpone decision" or
        "investigate X before deciding".
      </p>
      <p>Ready to get started? Click the button on the top of the page!</p>
    </div>
  );
}
