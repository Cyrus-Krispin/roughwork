import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAttemptRequest,
  parseTopicRequest,
  toPublicLearningError,
} from '../src/learning/ipc.ts';

test('trims a valid topic request', () => {
  assert.deepEqual(parseTopicRequest({ topic: '  Model training  ' }), {
    topic: 'Model training',
  });
});

test('rejects an empty topic request', () => {
  assert.throws(() => parseTopicRequest({ topic: '   ' }));
});

test('accepts a bounded attempt request', () => {
  const request = {
    topic: 'Model training',
    question: 'Why is a loss function necessary?',
    answer: 'It gives optimization a measurable objective.',
  };

  assert.deepEqual(parseAttemptRequest(request), request);
});

test('does not expose provider error details to the renderer', () => {
  const result = toPublicLearningError(
    new Error('Authorization failed for secret sk-private-value'),
  );

  assert.deepEqual(result, {
    code: 'provider_failed',
    message:
      'DeepSeek could not complete this step. Your answer is still here; please try again.',
  });
});

test('explains when the local key is missing', () => {
  const result = toPublicLearningError(
    new Error(
      'DeepSeek is not configured. Add DEEPSEEK_API_KEY to your local .env file.',
    ),
  );

  assert.equal(result.code, 'not_configured');
  assert.match(result.message, /\.env/);
});
