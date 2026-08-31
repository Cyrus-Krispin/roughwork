import assert from 'node:assert/strict';
import test from 'node:test';

import { ProviderRequestGate } from '../src/learning/providerRequestGate.ts';

test('ignores overlapping provider work and releases after completion', async () => {
  const gate = new ProviderRequestGate();
  let releaseFirst;
  const firstBlocked = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let calls = 0;

  const first = gate.run(async () => {
    calls += 1;
    await firstBlocked;
  });
  const overlapping = await gate.run(async () => {
    calls += 1;
  });

  assert.equal(overlapping, false);
  assert.equal(calls, 1);

  releaseFirst();
  assert.equal(await first, true);
  assert.equal(
    await gate.run(async () => {
      calls += 1;
    }),
    true,
  );
  assert.equal(calls, 2);
});

test('releases provider work after a failure', async () => {
  const gate = new ProviderRequestGate();

  await assert.rejects(
    gate.run(async () => {
      throw new Error('provider failed');
    }),
    /provider failed/,
  );

  assert.equal(await gate.run(async () => undefined), true);
});
