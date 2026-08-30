import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseDiagnosticQuestion,
  parseEvaluation,
} from '../src/learning/contracts.ts';

test('accepts one concise diagnostic question', () => {
  const result = parseDiagnosticQuestion(
    JSON.stringify({
      question:
        'What changes inside a neural network when it learns from an error?',
      intent: 'Check whether the learner connects loss to parameter updates.',
    }),
  );

  assert.equal(
    result.question,
    'What changes inside a neural network when it learns from an error?',
  );
});

test('rejects an empty diagnostic response', () => {
  assert.throws(
    () => parseDiagnosticQuestion(''),
    /DeepSeek returned an empty response/,
  );
});

test('accepts evidence quoted exactly from the learner answer', () => {
  const answer =
    'The gradient shows how the loss changes, so the optimizer moves the parameters in the opposite direction.';
  const result = parseEvaluation(
    JSON.stringify({
      status: 'partial',
      evidence: [
        {
          excerpt: 'optimizer moves the parameters in the opposite direction',
          finding: 'Correctly connects the gradient to the update direction.',
        },
      ],
      unresolvedGap: 'The role of gradient magnitude is not explained.',
      uncertainty: 'low',
      proposedNextMove: 'probe',
      nextQuestion:
        'What does the magnitude of a gradient change about one optimization step?',
      nextQuestionRationale:
        'This tests the missing relationship between gradient size and update size.',
    }),
    answer,
  );

  assert.equal(result.status, 'partial');
  assert.equal(result.proposedNextMove, 'probe');
});

test('rejects evidence fabricated by the model', () => {
  const answer = 'The optimizer changes the weights.';

  assert.throws(
    () =>
      parseEvaluation(
        JSON.stringify({
          status: 'demonstrated',
          evidence: [
            {
              excerpt: 'The optimizer follows the negative gradient.',
              finding: 'Explains the update direction.',
            },
          ],
          unresolvedGap: 'No major gap identified.',
          uncertainty: 'low',
          proposedNextMove: 'advance',
          nextQuestion: 'How does learning rate affect that update?',
          nextQuestionRationale: 'This advances from direction to step size.',
        }),
        answer,
      ),
    /Evidence must quote the learner answer exactly/,
  );
});

test('rejects a response with more than the allowed fields', () => {
  const answer = 'Loss measures the error.';

  assert.throws(() =>
    parseEvaluation(
      JSON.stringify({
        status: 'partial',
        evidence: [
          {
            excerpt: 'Loss measures the error',
            finding: 'Identifies the purpose of loss.',
          },
        ],
        unresolvedGap: 'The answer does not connect loss to learning.',
        uncertainty: 'low',
        proposedNextMove: 'probe',
        nextQuestion: 'How does the loss influence parameter updates?',
        nextQuestionRationale: 'This probes the missing causal connection.',
        fullExplanation: 'Here is the complete answer...',
      }),
      answer,
    ),
  );
});
