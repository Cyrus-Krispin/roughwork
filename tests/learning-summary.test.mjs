import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeLearningSession } from '../src/learning/summary.ts';

const firstEvaluation = {
  status: 'partial',
  evidence: [
    {
      excerpt: 'avoids scanning every row',
      finding: 'Connects an index to a narrower lookup.',
    },
  ],
  unresolvedGap: 'The write cost still needs explanation.',
  uncertainty: 'low',
  proposedNextMove: 'probe',
  nextQuestion: 'What cost does an index add to writes?',
  nextQuestionRationale: 'Tests the missing tradeoff.',
};

const revisedEvaluation = {
  ...firstEvaluation,
  status: 'demonstrated',
  unresolvedGap: 'How index selectivity changes lookup value.',
  proposedNextMove: 'advance',
  nextQuestion: 'When does low selectivity make an index less useful?',
  nextQuestionRationale: 'Advances from mechanics to index choice.',
};

test('summarizes latest judgments without counting the unanswered child', () => {
  const turns = [
    {
      questionId: 'question-1',
      turn: 1,
      question: 'Why do indexes speed up reads?',
      intent: 'Tests indexed lookup mechanics.',
      answer: 'An index avoids scanning every row.',
      evaluation: revisedEvaluation,
      evaluationHistory: [
        {
          id: 'evaluation-1',
          revision: 1,
          evaluation: firstEvaluation,
          challengeRationale: null,
          createdAt: '2026-08-31T00:00:00.000Z',
        },
        {
          id: 'evaluation-2',
          revision: 2,
          evaluation: revisedEvaluation,
          challengeRationale: 'I did explain the avoided scan.',
          createdAt: '2026-08-31T00:01:00.000Z',
        },
      ],
      help: [
        {
          id: 'help-1',
          requestId: 'request-1',
          ordinal: 1,
          level: 'rephrase',
          content: 'Which structure narrows the rows to inspect?',
          createdAt: '2026-08-31T00:00:30.000Z',
        },
      ],
    },
    {
      questionId: 'question-2',
      turn: 2,
      question: revisedEvaluation.nextQuestion,
      intent: revisedEvaluation.nextQuestionRationale,
      answer: null,
      evaluation: null,
      evaluationHistory: [],
      help: [],
    },
  ];

  const summary = summarizeLearningSession(turns);

  assert.equal(summary.answeredTurns, 1);
  assert.deepEqual(summary.statusCounts, {
    demonstrated: 1,
    partial: 0,
    misconception: 0,
    uncertain: 0,
  });
  assert.equal(summary.evidence[0].status, 'demonstrated');
  assert.equal(
    summary.unresolvedGaps[0].gap,
    'How index selectivity changes lookup value.',
  );
  assert.equal(summary.helpSteps, 1);
  assert.equal(summary.revisedJudgments, 1);
  assert.equal(summary.nextQuestion, revisedEvaluation.nextQuestion);
});

test('returns an honest empty summary before the learner attempts a question', () => {
  const summary = summarizeLearningSession([
    {
      questionId: 'question-1',
      turn: 1,
      question: 'What does a derivative measure?',
      intent: 'Tests the core interpretation.',
      answer: null,
      evaluation: null,
      evaluationHistory: [],
      help: [],
    },
  ]);

  assert.equal(summary.answeredTurns, 0);
  assert.deepEqual(summary.evidence, []);
  assert.deepEqual(summary.unresolvedGaps, []);
  assert.equal(summary.nextQuestion, 'What does a derivative measure?');
});

test('keeps long sessions compact and favors the latest distinct evidence', () => {
  const turns = Array.from({ length: 8 }, (_, index) => ({
    questionId: `question-${index}`,
    turn: index + 1,
    question: `Question ${index}?`,
    intent: 'Tests one concept.',
    answer: `Answer ${index}`,
    evaluation: {
      ...firstEvaluation,
      evidence: [
        {
          excerpt: `Answer ${index}`,
          finding: `Finding ${index}`,
        },
      ],
      unresolvedGap: `Gap ${index}`,
      nextQuestion: `Next question ${index}?`,
    },
    evaluationHistory: [],
    help: [],
  }));

  const summary = summarizeLearningSession(turns);

  assert.equal(summary.evidence.length, 5);
  assert.equal(summary.evidence[0].finding, 'Finding 3');
  assert.equal(summary.evidence[4].finding, 'Finding 7');
  assert.equal(summary.unresolvedGaps.length, 4);
  assert.equal(summary.unresolvedGaps[0].gap, 'Gap 4');
  assert.equal(summary.unresolvedGaps[3].gap, 'Gap 7');
});
