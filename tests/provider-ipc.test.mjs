import assert from 'node:assert/strict';
import test from 'node:test';

import { registerProviderIpcHandlers } from '../src/main/providerIpc.ts';

function harness({ trusted = true } = {}) {
  const handlers = new Map();
  const calls = [];
  const status = {
    configured: true,
    model: 'deepseek-test',
    source: 'secure_store',
    secureStorageAvailable: true,
    hasStoredCredential: true,
  };
  const credentials = {
    async getStatus() {
      calls.push(['status']);
      return status;
    },
    async save(key) {
      calls.push(['save', key]);
    },
    async remove() {
      calls.push(['remove']);
    },
  };
  registerProviderIpcHandlers(
    { handle: (channel, handler) => handlers.set(channel, handler) },
    {
      credentials,
      assertTrusted: () => {
        if (!trusted) throw new Error('untrusted');
      },
      openExternal: async (url) => calls.push(['open', url]),
    },
  );
  return { handlers, calls, status };
}

test('provider IPC saves once and never returns the plaintext key', async () => {
  const { handlers, calls } = harness();
  const result = await handlers.get('learning:save-provider-credential')(
    {},
    { apiKey: '  secret-test-key  ' },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [['save', 'secret-test-key'], ['status']]);
  assert.doesNotMatch(JSON.stringify(result), /secret-test-key/);
});

test('malformed and untrusted provider IPC never reaches credential storage', async () => {
  const malformed = harness();
  const result = await malformed.handlers.get(
    'learning:save-provider-credential',
  )({}, { apiKey: 'short' });
  assert.equal(result.ok, false);
  assert.deepEqual(malformed.calls, []);

  const untrusted = harness({ trusted: false });
  assert.throws(
    () => untrusted.handlers.get('learning:remove-provider-credential')({}),
    /untrusted/,
  );
  assert.deepEqual(untrusted.calls, []);
});

test('provider IPC removes once and opens only the fixed DeepSeek key URL', async () => {
  const { handlers, calls } = harness();
  const removed = await handlers.get('learning:remove-provider-credential')({});
  await handlers.get('learning:open-deepseek-keys')({});

  assert.equal(removed.ok, true);
  assert.deepEqual(calls, [
    ['remove'],
    ['status'],
    ['open', 'https://platform.deepseek.com/api_keys'],
  ]);
});
