import assert from 'node:assert/strict';
import test from 'node:test';

import { openLearningDatabase } from '../src/main/persistence/database.ts';
import { LearningSessionRepository } from '../src/main/persistence/sessionRepository.ts';

const diagnosticQuestion = {
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

function createRepository() {
  const database = openLearningDatabase(':memory:');
  let id = 0;
  let time = 0;
  const repository = new LearningSessionRepository(database, {
    createId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    now: () => new Date(Date.UTC(2026, 7, 30, 0, 0, time++)).toISOString(),
  });
  return { database, repository };
}

test('opens a migrated database with safety pragmas enabled', () => {
  const { database } = createRepository();

  const migration = database
    .prepare('SELECT MAX(version) AS version FROM schema_migrations')
    .get();
  const foreignKeys = database.prepare('PRAGMA foreign_keys').get();

  assert.equal(migration.version, 1);
  assert.equal(foreignKeys.foreign_keys, 1);
  database.close();
});

test('creates and reloads an active session at its current question', () => {
  const { database, repository } = createRepository();

  const created = repository.createSession(
    '  Database indexes  ',
    diagnosticQuestion,
  );
  const reloaded = repository.getSession(created.id);

  assert.equal(created.topic, 'Database indexes');
  assert.equal(created.status, 'active');
  assert.equal(created.currentQuestionId, created.turns[0].questionId);
  assert.deepEqual(reloaded, created);
  assert.deepEqual(created.turns[0], {
    questionId: created.currentQuestionId,
    turn: 1,
    question: diagnosticQuestion.question,
    intent: diagnosticQuestion.intent,
    answer: null,
    evaluation: null,
  });
  database.close();
});

test('atomically records immutable evidence and advances the current question', () => {
  const { database, repository } = createRepository();
  const session = repository.createSession(
    'Database indexes',
    diagnosticQuestion,
  );

  const saved = repository.recordEvaluation({
    sessionId: session.id,
    questionId: session.currentQuestionId,
    answer: 'They avoid scanning every row for each lookup.',
    evaluation,
  });

  assert.equal(saved.turns.length, 2);
  assert.equal(saved.currentQuestionId, saved.turns[1].questionId);
  assert.equal(
    saved.turns[0].answer,
    'They avoid scanning every row for each lookup.',
  );
  assert.deepEqual(saved.turns[0].evaluation, evaluation);
  assert.equal(saved.turns[1].question, evaluation.nextQuestion);
  assert.equal(saved.turns[1].intent, evaluation.nextQuestionRationale);

  assert.throws(
    () =>
      repository.recordEvaluation({
        sessionId: session.id,
        questionId: session.currentQuestionId,
        answer: 'A different answer must not overwrite history.',
        evaluation,
      }),
    /already has a different acknowledged answer/u,
  );
  database.close();
});

test('returns the saved result when an acknowledged submission is retried', () => {
  const { database, repository } = createRepository();
  const session = repository.createSession(
    'Database indexes',
    diagnosticQuestion,
  );
  const input = {
    sessionId: session.id,
    questionId: session.currentQuestionId,
    answer: 'They avoid scanning every row for each lookup.',
    evaluation,
  };

  const first = repository.recordEvaluation(input);
  const retry = repository.recordEvaluation(input);
  const attemptCount = database
    .prepare('SELECT COUNT(*) AS count FROM attempts')
    .get();

  assert.deepEqual(retry, first);
  assert.equal(attemptCount.count, 1);
  database.close();
});

test('ends without changing history and rejects later submissions', () => {
  const { database, repository } = createRepository();
  const session = repository.createSession(
    'Database indexes',
    diagnosticQuestion,
  );

  const ended = repository.endSession(session.id);

  assert.equal(ended.status, 'ended');
  assert.ok(ended.endedAt);
  assert.throws(
    () =>
      repository.recordEvaluation({
        sessionId: session.id,
        questionId: session.currentQuestionId,
        answer: 'They avoid scanning every row for each lookup.',
        evaluation,
      }),
    /not active/u,
  );
  database.close();
});

test('lists evidence-based summaries and deletes only the selected session', () => {
  const { database, repository } = createRepository();
  const first = repository.createSession(
    'Database indexes',
    diagnosticQuestion,
  );
  repository.recordEvaluation({
    sessionId: first.id,
    questionId: first.currentQuestionId,
    answer: 'They avoid scanning every row for each lookup.',
    evaluation,
  });
  const second = repository.createSession('Neural networks', {
    question: 'What role does a loss function play?',
    intent: 'Tests whether the learner can connect loss to optimization.',
  });

  const summaries = repository.listSessions(10);

  assert.equal(summaries.length, 2);
  assert.equal(summaries[0].id, second.id);
  assert.deepEqual(summaries[1].evaluationCounts, {
    demonstrated: 0,
    partial: 1,
    misconception: 0,
    uncertain: 0,
  });
  assert.equal(summaries[1].answeredTurns, 1);
  assert.equal(summaries[1].totalQuestions, 2);

  assert.equal(repository.deleteSession(first.id), true);
  assert.equal(repository.getSession(first.id), null);
  assert.ok(repository.getSession(second.id));
  assert.equal(
    database.prepare('SELECT COUNT(*) AS count FROM attempts').get().count,
    0,
  );
  database.close();
});
