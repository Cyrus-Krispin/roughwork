import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

import { ProviderCredentialStore } from '../src/main/providerCredentialStore.ts';

function fakeCipher() {
  return {
    available: true,
    async isAvailable() {
      return this.available;
    },
    async encrypt(value) {
      return Buffer.from(`encrypted:${value}`, 'utf8');
    },
    async decrypt(value) {
      const decoded = value.toString('utf8');
      if (!decoded.startsWith('encrypted:')) throw new Error('cannot decrypt');
      return {
        value: decoded.slice('encrypted:'.length),
        shouldReEncrypt: false,
      };
    },
  };
}

async function makeStore({ environmentKey = '', cipher = fakeCipher() } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'strata-credential-test-'));
  const filePath = join(directory, 'provider-credential.json');
  return {
    cipher,
    filePath,
    store: new ProviderCredentialStore({
      filePath,
      cipher,
      environmentKey,
      model: 'deepseek-test',
    }),
  };
}

test('persists only an encrypted provider key with private file permissions', async () => {
  const { store, filePath } = await makeStore();

  await store.save('  sk-private-value  ');

  const contents = await readFile(filePath, 'utf8');
  assert.doesNotMatch(contents, /sk-private-value/);
  assert.deepEqual(await store.getCredential(), {
    apiKey: 'sk-private-value',
    model: 'deepseek-test',
    source: 'secure_store',
  });
  assert.equal((await stat(filePath)).mode & 0o777, 0o600);
});

test('uses the development environment key only when no saved key exists', async () => {
  const { store } = await makeStore({ environmentKey: ' env-test-key ' });

  assert.deepEqual(await store.getCredential(), {
    apiKey: 'env-test-key',
    model: 'deepseek-test',
    source: 'environment',
  });
  assert.deepEqual(await store.getStatus(), {
    configured: true,
    model: 'deepseek-test',
    source: 'environment',
    secureStorageAvailable: true,
    hasStoredCredential: false,
  });
});

test('saved key takes precedence and removal restores the environment fallback', async () => {
  const { store } = await makeStore({ environmentKey: 'env-test-key' });
  await store.save('saved-key');
  assert.equal((await store.getCredential()).source, 'secure_store');

  await store.remove();

  assert.equal((await store.getCredential()).source, 'environment');
});

test('serializes an earlier save before a later removal', async () => {
  let releaseEncryption;
  const cipher = fakeCipher();
  cipher.encrypt = async (value) => {
    await new Promise((resolve) => {
      releaseEncryption = resolve;
    });
    return Buffer.from(`encrypted:${value}`, 'utf8');
  };
  const { store } = await makeStore({ cipher });

  const saving = store.save('saved-key');
  await new Promise((resolve) => setImmediate(resolve));
  const removing = store.remove();
  releaseEncryption();
  await Promise.all([saving, removing]);

  assert.equal(await store.getCredential(), null);
});

test('rejects unknown stored fields and invalid environment key lengths', async () => {
  const { store, filePath } = await makeStore({ environmentKey: 'short' });
  const invalid = JSON.stringify({
    version: 1,
    encryptedApiKey: Buffer.from('encrypted:saved-key').toString('base64'),
    apiKey: 'plaintext-must-never-be-accepted',
  });
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(filePath, invalid, { mode: 0o600 }),
  );

  assert.equal((await store.getStatus()).hasStoredCredential, true);
  await assert.rejects(store.getCredential(), /could not be unlocked/i);
  await store.remove();
  assert.equal(await store.getCredential(), null);
});

test('fails closed when secure storage is unavailable', async () => {
  const cipher = fakeCipher();
  cipher.available = false;
  const { store } = await makeStore({ cipher });

  await assert.rejects(
    store.save('saved-key'),
    /secure storage is unavailable/i,
  );
  assert.deepEqual(await store.getStatus(), {
    configured: false,
    model: 'deepseek-test',
    source: null,
    secureStorageAvailable: false,
    hasStoredCredential: false,
  });
});

test('attempts authoritative encryption when availability is unknown', async () => {
  const cipher = fakeCipher();
  cipher.available = null;
  const { store } = await makeStore({ cipher });

  assert.equal((await store.getStatus()).secureStorageAvailable, null);
  await store.save('saved-key');
  assert.equal((await store.getCredential()).source, 'secure_store');
});

test('reports an unreadable saved credential without leaking its failure', async () => {
  const { store, filePath } = await makeStore();
  await store.save('saved-key');
  const broken = JSON.stringify({ version: 1, encryptedApiKey: 'not-base64!' });
  await import('node:fs/promises').then(({ writeFile }) =>
    writeFile(filePath, broken, { mode: 0o600 }),
  );

  const status = await store.getStatus();
  assert.equal(status.configured, false);
  assert.equal(status.source, null);
  assert.equal(status.hasStoredCredential, true);
  assert.match(status.problem, /could not be unlocked/i);
  await assert.rejects(store.getCredential(), /could not be unlocked/i);
});
