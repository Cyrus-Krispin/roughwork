import assert from 'node:assert/strict';
import test from 'node:test';

import { DeepSeekLearningProvider } from '../src/main/ai/deepseek.ts';

function fakeClient(content) {
  const requests = [];

  return {
    requests,
    chat: {
      completions: {
        async create(request) {
          requests.push(request);
          return {
            choices: [{ message: { content } }],
          };
        },
      },
    },
  };
}

test('requests a JSON diagnostic question from DeepSeek', async () => {
  const client = fakeClient(
    JSON.stringify({
      question: 'Why does training a model require a loss function?',
      intent: 'Check whether the learner understands the optimization target.',
    }),
  );
  const provider = new DeepSeekLearningProvider(client, 'deepseek-v4-flash');

  const result = await provider.createDiagnosticQuestion('Model training');

  assert.equal(
    result.question,
    'Why does training a model require a loss function?',
  );
  assert.equal(client.requests.length, 1);
  assert.deepEqual(client.requests[0].response_format, {
    type: 'json_object',
  });
  assert.equal(client.requests[0].model, 'deepseek-v4-flash');
  assert.deepEqual(client.requests[0].thinking, { type: 'disabled' });
  assert.match(client.requests[0].messages[0].content, /at most 16 words/i);
  assert.match(client.requests[0].messages[0].content, /one small step/i);
  assert.match(client.requests[0].messages[1].content, /Model training/);
});

test('evaluates an attempt and proposes exactly one next question', async () => {
  const answer = 'The loss gives the model a number to reduce during training.';
  const client = fakeClient(
    JSON.stringify({
      status: 'partial',
      evidence: [
        {
          excerpt: 'a number to reduce during training',
          finding: 'Connects loss to the optimization objective.',
        },
      ],
      unresolvedGap: 'The answer does not explain how parameters are updated.',
      uncertainty: 'low',
      proposedNextMove: 'probe',
      nextQuestion: 'How does the loss lead to a change in model parameters?',
      nextQuestionRationale: 'This probes the missing update mechanism.',
    }),
  );
  const provider = new DeepSeekLearningProvider(client, 'deepseek-v4-flash');

  const result = await provider.evaluateAttempt({
    topic: 'Model training',
    question: 'Why does training a model require a loss function?',
    answer,
  });

  assert.equal(result.status, 'partial');
  assert.equal(client.requests.length, 1);
  assert.match(client.requests[0].messages[1].content, new RegExp(answer));
  assert.deepEqual(client.requests[0].response_format, {
    type: 'json_object',
  });
  assert.deepEqual(client.requests[0].thinking, { type: 'disabled' });
  assert.match(client.requests[0].messages[0].content, /at most 16 words/i);
  assert.match(client.requests[0].messages[0].content, /smallest unresolved/i);
});

test('fails closed when DeepSeek returns empty content', async () => {
  const client = fakeClient(null);
  const provider = new DeepSeekLearningProvider(client, 'deepseek-v4-flash');

  await assert.rejects(
    provider.createDiagnosticQuestion('Calculus'),
    /DeepSeek returned an empty response/,
  );
});
