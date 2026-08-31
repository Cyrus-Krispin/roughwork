import assert from 'node:assert/strict';
import test from 'node:test';

import {
  denyAllRendererPermissions,
  enforceProductionContentSecurityPolicy,
} from '../src/main/sessionSecurity.ts';

test('denies renderer permission checks and requests', () => {
  let deviceHandler;
  let checkHandler;
  let requestHandler;
  const session = {
    setDevicePermissionHandler(handler) {
      deviceHandler = handler;
    },
    setPermissionCheckHandler(handler) {
      checkHandler = handler;
    },
    setPermissionRequestHandler(handler) {
      requestHandler = handler;
    },
  };

  denyAllRendererPermissions(session);

  assert.equal(deviceHandler(), false);
  assert.equal(checkHandler(), false);
  let decision;
  requestHandler({}, 'media', (allowed) => {
    decision = allowed;
  });
  assert.equal(decision, false);
});

test('adds a no-network content policy only to packaged responses', () => {
  let listener;
  const session = {
    webRequest: {
      onHeadersReceived(value) {
        listener = value;
      },
    },
  };

  enforceProductionContentSecurityPolicy(session, false);
  assert.equal(listener, undefined);

  enforceProductionContentSecurityPolicy(session, true);
  let response;
  listener(
    { responseHeaders: { Existing: ['value'] } },
    (value) => (response = value),
  );

  assert.deepEqual(response.responseHeaders.Existing, ['value']);
  assert.match(
    response.responseHeaders['Content-Security-Policy'][0],
    /connect-src 'none'/,
  );
  assert.match(
    response.responseHeaders['Content-Security-Policy'][0],
    /frame-ancestors 'none'/,
  );
});
