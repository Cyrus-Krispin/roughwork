import assert from 'node:assert/strict';
import test from 'node:test';

import { LearningService } from '../src/main/learningService.ts';
import { openLearningDatabase } from '../src/main/persistence/database.ts';
import { LearningSessionRepository } from '../src/main/persistence/sessionRepository.ts';

const question = {
  question: 'Why do database indexes speed up reads?',
  intent: 'Tests whether the learner understands indexed lookup tradeoffs.',
};

const evaluation = {
  status: 'partial',
  evidence: [
    {
      excerpt: 'avoid scanning every row',
      finding: 'Identifies the main lookup advantage.',
    },
  ],
  unresolvedGap: 'The write and storage costs are not yet explained.',
  uncertainty: 'low',
  proposedNextMove: 'probe',
  nextQuestion: 'What costs does an index add to writes?',
  nextQuestionRationale: 'Probes the missing tradeoff in the answer.',
};

function setup() {
  const database = openLearningDatabase(':memory:');
  const repository = new LearningSessionRepository(database);
  const calls = {
    questions: 0,
    evaluations: 0,
    help: 0,
    challenges: 0,
    contexts: [],
  };
  const provider = {
    async createDiagnosticQuestion() {
      calls.questions += 1;
      return question;
    },
    async evaluateAttempt(context) {
      calls.evaluations += 1;
      calls.contexts.push(context);
      return evaluation;
    },
    async createHelpResponse(context) {
      calls.help += 1;
      return {
        level: context.level,
        content: 'What lookup structure can avoid visiting every row?',
      };
    },
    async reconsiderEvaluation() {
      calls.challenges += 1;
      return {
        ...evaluation,
        status: 'demonstrated',
        proposedNextMove: 'advance',
      };
    },
  };
  const service = new LearningService(repository, () => provider);
  return { calls, database, repository, service };
}

test('starts only after a diagnostic question succeeds', async () => {
  const { calls, database, service } = setup();

  const session = await service.startSession('Database indexes');

  assert.equal(calls.questions, 1);
  assert.equal(session.topic, 'Database indexes');
  assert.equal(service.listSessions(20).length, 1);
  database.close();
});

test('enforces and persists graduated help with idempotent request ids', async () => {
  const { calls, database, service } = setup();
  const session = await service.startSession('Database indexes');
  const input = {
    requestId: crypto.randomUUID(),
    sessionId: session.id,
    questionId: session.currentQuestionId,
    level: 'rephrase',
  };

  const saved = await service.requestHelp(input);
  await service.requestHelp(input);

  assert.equal(calls.help, 1);
  assert.equal(saved.turns[0].help[0].level, 'rephrase');
  await assert.rejects(
    service.requestHelp({
      ...input,
      requestId: crypto.randomUUID(),
      level: 'hint',
    }),
    /help level is not available/i,
  );
  database.close();
});

test('appends a challenged evaluation and preserves its rationale', async () => {
  const { calls, database, service } = setup();
  const session = await service.startSession('Database indexes');
  const evaluated = await service.submitAttempt({
    sessionId: session.id,
    questionId: session.currentQuestionId,
    answer: 'They avoid scanning every row for each lookup.',
  });
  const evaluationId = evaluated.turns[0].evaluationHistory[0].id;
  const saved = await service.challengeEvaluation({
    requestId: crypto.randomUUID(),
    sessionId: session.id,
    questionId: session.currentQuestionId,
    evaluationId,
    rationale: 'I identified the avoided scan.',
  });

  assert.equal(calls.challenges, 1);
  assert.equal(saved.turns[0].evaluationHistory.length, 2);
  assert.equal(saved.turns[0].evaluation.status, 'demonstrated');
  database.close();
});

test('does not leave a partial session when question generation fails', async () => {
  const { database, repository } = setup();
  const service = new LearningService(repository, () => ({
    async createDiagnosticQuestion() {
      throw new Error('provider unavailable');
    },
    async evaluateAttempt() {
      throw new Error('not reached');
    },
  }));

  await assert.rejects(service.startSession('Database indexes'));
  assert.equal(repository.listSessions(20).length, 0);
  database.close();
});

test('evaluates the persisted current question and saves one acknowledged attempt', async () => {
  const { calls, database, service } = setup();
  const session = await service.startSession('Database indexes');
  const input = {
    sessionId: session.id,
    questionId: session.currentQuestionId,
    answer: 'They avoid scanning every row for each lookup.',
  };

  const saved = await service.submitAttempt(input);
  const retried = await service.submitAttempt(input);

  assert.equal(calls.evaluations, 1);
  assert.deepEqual(calls.contexts[0], {
    topic: 'Database indexes',
    question: question.question,
    answer: input.answer,
  });
  assert.deepEqual(retried, saved);
  assert.equal(saved.turns[0].answer, input.answer);
  database.close();
});

test('exposes local list, load, end, and delete operations without a provider call', async () => {
  const { calls, database, service } = setup();
  const session = await service.startSession('Database indexes');

  assert.equal(service.getSession(session.id)?.id, session.id);
  assert.equal(service.endSession(session.id).status, 'ended');
  assert.equal(service.listSessions(20)[0].status, 'ended');
  assert.equal(service.deleteSession(session.id), true);
  assert.equal(service.getSession(session.id), null);
  assert.equal(calls.questions, 1);
  assert.equal(calls.evaluations, 0);
  database.close();
});
