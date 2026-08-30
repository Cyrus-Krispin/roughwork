import assert from 'node:assert/strict';
import test from 'node:test';

import {
  initialLearningSession,
  learningSessionReducer,
} from '../src/learning/session.ts';

const question = {
  question: 'What role does a loss function play during model training?',
  intent: 'Check whether the learner understands the optimization objective.',
};

const evaluation = {
  status: 'partial',
  evidence: [
    {
      excerpt: 'a number the model tries to reduce',
      finding: 'Connects loss to an optimization target.',
    },
  ],
  unresolvedGap: 'The answer does not connect loss to parameter updates.',
  uncertainty: 'low',
  proposedNextMove: 'probe',
  nextQuestion: 'How does reducing loss cause model parameters to change?',
  nextQuestionRationale: 'This probes the missing update mechanism.',
};

test('starts a session and receives the first AI question', () => {
  const starting = learningSessionReducer(initialLearningSession, {
    type: 'start',
    topic: 'Model training',
  });
  const ready = learningSessionReducer(starting, {
    type: 'question_received',
    question,
  });

  assert.equal(starting.status, 'loading_question');
  assert.equal(ready.status, 'answering');
  assert.equal(ready.topic, 'Model training');
  assert.equal(ready.currentQuestion, question.question);
});

test('preserves the exact learner answer while evaluation is pending', () => {
  const state = {
    ...initialLearningSession,
    status: 'answering',
    topic: 'Model training',
    currentQuestion: question.question,
    questionIntent: question.intent,
  };
  const answer = '  It is a number the model tries to reduce.  ';
  const typing = learningSessionReducer(state, {
    type: 'answer_changed',
    answer,
  });
  const evaluating = learningSessionReducer(typing, { type: 'submit' });

  assert.equal(evaluating.status, 'evaluating');
  assert.equal(evaluating.answer, answer);
});

test('keeps the answer recoverable when evaluation fails', () => {
  const state = {
    ...initialLearningSession,
    status: 'evaluating',
    topic: 'Model training',
    currentQuestion: question.question,
    answer: 'Loss is a number the model reduces.',
  };
  const failed = learningSessionReducer(state, {
    type: 'request_failed',
    message: 'DeepSeek could not complete this step.',
  });

  assert.equal(failed.status, 'error');
  assert.equal(failed.answer, 'Loss is a number the model reduces.');
});

test('continues with the AI next question and clears the answer', () => {
  const state = {
    ...initialLearningSession,
    status: 'feedback',
    topic: 'Model training',
    currentQuestion: question.question,
    answer: 'It is a number the model tries to reduce.',
    evaluation,
    turn: 1,
  };
  const next = learningSessionReducer(state, { type: 'continue' });

  assert.equal(next.status, 'answering');
  assert.equal(next.currentQuestion, evaluation.nextQuestion);
  assert.equal(next.answer, '');
  assert.equal(next.turn, 2);
});

test('does not submit a blank answer', () => {
  const state = {
    ...initialLearningSession,
    status: 'answering',
    topic: 'Calculus',
    currentQuestion: 'What does a derivative measure?',
    answer: '   ',
  };

  assert.equal(
    learningSessionReducer(state, { type: 'submit' }).status,
    'answering',
  );
});
