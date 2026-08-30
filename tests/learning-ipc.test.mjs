import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseListSessionsRequest,
  parseSessionRequest,
  parseSubmitAttemptRequest,
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

test('accepts bounded persisted-session requests', () => {
  const sessionId = '00000000-0000-4000-8000-000000000001';
  const questionId = '00000000-0000-4000-8000-000000000002';

  assert.deepEqual(parseSessionRequest({ sessionId }), { sessionId });
  assert.deepEqual(
    parseSubmitAttemptRequest({
      sessionId,
      questionId,
      answer: '  Evidence  ',
    }),
    { sessionId, questionId, answer: '  Evidence  ' },
  );
  assert.deepEqual(parseListSessionsRequest({}), { limit: 20 });
  assert.deepEqual(parseListSessionsRequest({ limit: 7 }), { limit: 7 });
});

test('rejects unbounded or malformed persisted-session requests', () => {
  assert.throws(() => parseSessionRequest({ sessionId: 'not-a-uuid' }));
  assert.throws(() => parseListSessionsRequest({ limit: 1000 }));
  assert.throws(() =>
    parseSubmitAttemptRequest({
      sessionId: '00000000-0000-4000-8000-000000000001',
      questionId: '00000000-0000-4000-8000-000000000002',
      answer: '',
    }),
  );
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
