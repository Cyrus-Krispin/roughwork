import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSameRendererLocation,
  isTrustedIpcSender,
  selectDevelopmentEnvironmentKey,
} from '../src/main/ipcSecurity.ts';

test('trusts only a registered webContents main frame', () => {
  const expected = 'file:///Applications/Strata AI.app/index.html';
  const mainFrame = { url: 'file:///Applications/Strata%20AI.app/index.html' };
  const sender = { id: 7, mainFrame };
  assert.equal(
    isTrustedIpcSender(
      { sender, senderFrame: mainFrame },
      new Set([7]),
      expected,
    ),
    true,
  );
  assert.equal(
    isTrustedIpcSender(
      { sender, senderFrame: { url: expected } },
      new Set([7]),
      expected,
    ),
    false,
  );
  assert.equal(
    isTrustedIpcSender(
      { sender, senderFrame: mainFrame },
      new Set([8]),
      expected,
    ),
    false,
  );
  mainFrame.url = 'https://attacker.example/';
  assert.equal(
    isTrustedIpcSender(
      { sender, senderFrame: mainFrame },
      new Set([7]),
      expected,
    ),
    false,
  );
});

test('canonicalizes encoded packaged paths but rejects location changes', () => {
  assert.equal(
    isSameRendererLocation(
      'file:///Applications/Strata%20AI.app/index.html',
      'file:///Applications/Strata AI.app/index.html',
    ),
    true,
  );
  assert.equal(
    isSameRendererLocation(
      'file:///Applications/Strata%20AI.app/other.html',
      'file:///Applications/Strata AI.app/index.html',
    ),
    false,
  );
});

test('packaged builds never receive a development environment key', () => {
  assert.equal(selectDevelopmentEnvironmentKey(true, 'secret-key'), '');
  assert.equal(
    selectDevelopmentEnvironmentKey(false, 'secret-key'),
    'secret-key',
  );
});
