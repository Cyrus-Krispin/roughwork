import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluationStatusLabel,
  presentEvaluationRevisions,
  shouldShowHistoryRows,
} from '../src/learning/presentation.ts';
import { deleteLocalSession } from '../src/learning/historyOperations.ts';

const evaluation = {
  status: 'demonstrated',
  evidence: [{ excerpt: 'because', finding: 'Gives a reason.' }],
  unresolvedGap: 'The boundary case is not covered.',
  uncertainty: 'high',
  proposedNextMove: 'probe',
  nextQuestion: 'What happens at the boundary?',
  nextQuestionRationale: 'Checks the remaining boundary case.',
};

test('uses the exact provisional status independently of uncertainty', () => {
  assert.equal(evaluationStatusLabel(evaluation.status), 'Demonstrated');
  assert.equal(evaluation.uncertainty, 'high');
});

test('marks only the latest complete persisted revision', () => {
  const revisions = presentEvaluationRevisions([
    {
      id: 'one',
      revision: 1,
      evaluation: { ...evaluation, status: 'partial' },
      challengeRationale: null,
      createdAt: '2026-01-01',
    },
    {
      id: 'two',
      revision: 2,
      evaluation,
      challengeRationale: 'The first finding missed my reason.',
      createdAt: '2026-01-02',
    },
  ]);

  assert.equal(revisions[0].latest, false);
  assert.equal(revisions[1].latest, true);
  assert.equal(revisions[1].statusLabel, 'Demonstrated');
  assert.deepEqual(revisions[1].evaluation, evaluation);
});

test('hides cached history actions while loading or stale', () => {
  assert.equal(shouldShowHistoryRows(true, ''), false);
  assert.equal(shouldShowHistoryRows(false, 'refresh failed'), false);
  assert.equal(shouldShowHistoryRows(false, ''), true);
});

test('distinguishes deleted, already absent, failed, and rejected deletion', async () => {
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal(
    await deleteLocalSession(
      { deleteSession: async () => ({ ok: true, data: true }) },
      id,
    ),
    'deleted',
  );
  assert.equal(
    await deleteLocalSession(
      { deleteSession: async () => ({ ok: true, data: false }) },
      id,
    ),
    'already_absent',
  );
  assert.equal(
    await deleteLocalSession(
      {
        deleteSession: async () => ({
          ok: false,
          error: { code: 'provider_failed', message: 'hidden' },
        }),
      },
      id,
    ),
    'failed',
  );
  assert.equal(
    await deleteLocalSession(
      { deleteSession: async () => Promise.reject(new Error('ipc failed')) },
      id,
    ),
    'failed',
  );
});
