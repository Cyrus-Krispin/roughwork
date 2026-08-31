import assert from 'node:assert/strict';
import test from 'node:test';

import { parseEvaluation } from '../src/learning/contracts.ts';
import {
  founderEvaluationCases,
  invalidEvaluationCases,
} from './fixtures/evaluations.mjs';

test('the founder set covers twelve answers across all quality levels', () => {
  assert.equal(founderEvaluationCases.length, 12);

  const counts = Object.groupBy(
    founderEvaluationCases,
    ({ quality }) => quality,
  );

  for (const quality of [
    'demonstrated',
    'partial',
    'misconception',
    'uncertain',
  ]) {
    assert.equal(counts[quality]?.length, 3);
  }
});

test('every founder evaluation satisfies the runtime contract', () => {
  for (const fixture of founderEvaluationCases) {
    assert.ok(fixture.requiredConceptEvidence.length > 0, fixture.name);
    assert.ok(fixture.forbiddenClaims.length > 0, fixture.name);

    const result = parseEvaluation(
      JSON.stringify(fixture.evaluation),
      fixture.answer,
    );

    assert.equal(result.status, fixture.quality, fixture.name);
    assert.ok(fixture.acceptableNextMoves.includes(result.proposedNextMove));
    assert.ok(
      result.evidence.every(({ excerpt }) => fixture.answer.includes(excerpt)),
      fixture.name,
    );
  }
});

test('answer quality levels produce meaningfully different next moves', () => {
  const movesByQuality = Object.groupBy(
    founderEvaluationCases,
    ({ quality }) => quality,
  );

  assert.deepEqual(
    new Set(
      movesByQuality.demonstrated.map(
        ({ evaluation }) => evaluation.proposedNextMove,
      ),
    ),
    new Set(['advance']),
  );
  assert.deepEqual(
    new Set(
      movesByQuality.partial.map(
        ({ evaluation }) => evaluation.proposedNextMove,
      ),
    ),
    new Set(['probe']),
  );
  assert.deepEqual(
    new Set(
      movesByQuality.misconception.map(
        ({ evaluation }) => evaluation.proposedNextMove,
      ),
    ),
    new Set(['prerequisite']),
  );
  assert.deepEqual(
    new Set(
      movesByQuality.uncertain.map(
        ({ evaluation }) => evaluation.proposedNextMove,
      ),
    ),
    new Set(['hint']),
  );
});

test('invalid provider outputs fail closed for each guarded failure mode', () => {
  for (const fixture of invalidEvaluationCases) {
    assert.throws(
      () => parseEvaluation(JSON.stringify(fixture.evaluation), fixture.answer),
      fixture.error,
      fixture.name,
    );
  }
});
