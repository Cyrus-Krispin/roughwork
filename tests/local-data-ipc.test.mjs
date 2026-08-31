import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  learningBackupFormat,
  learningBackupFormatVersion,
} from '../src/learning/localData.ts';
import { registerLocalDataIpcHandlers } from '../src/main/localDataIpc.ts';

function setup(overrides = {}) {
  const handlers = new Map();
  let trusted = 0;
  let imported;
  const dialogs = {
    async showSaveDialog() {
      return { canceled: true };
    },
    async showOpenDialog() {
      return { canceled: true, filePaths: [] };
    },
    async showMessageBox() {
      return { response: 0 };
    },
    ...overrides.dialogs,
  };
  const repository = {
    listAllSessions() {
      return [];
    },
    importSessions(sessions) {
      imported = sessions;
      return { imported: sessions.length, skipped: 0 };
    },
    ...overrides.repository,
  };
  registerLocalDataIpcHandlers(
    { handle: (channel, handler) => handlers.set(channel, handler) },
    {
      dialogs,
      repository,
      assertTrusted() {
        trusted += 1;
      },
      appVersion: '0.1.0',
      now: () => new Date('2026-08-31T12:00:00.000Z'),
    },
  );
  return { handlers, imported: () => imported, trusted: () => trusted };
}

test('treats native backup dialog cancellation as neutral', async () => {
  const { handlers, trusted } = setup();

  assert.deepEqual(await handlers.get('learning:export-data')({}), {
    ok: true,
    data: { status: 'cancelled' },
  });
  assert.deepEqual(await handlers.get('learning:restore-data')({}), {
    ok: true,
    data: { status: 'cancelled' },
  });
  assert.equal(trusted(), 2);
});

test('exports a versioned backup without returning its path', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-ipc-export-'));
  const path = join(directory, 'backup.json');
  const { handlers } = setup({
    dialogs: {
      async showSaveDialog() {
        return { canceled: false, filePath: path };
      },
    },
  });

  const result = await handlers.get('learning:export-data')({});
  assert.deepEqual(result, {
    ok: true,
    data: { status: 'saved', sessionCount: 0 },
  });
  assert.doesNotMatch(JSON.stringify(result), new RegExp(path));
  await rm(directory, { recursive: true });
});

test('validates and confirms restore before one repository mutation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-ipc-restore-'));
  const path = join(directory, 'backup.json');
  await writeFile(
    path,
    JSON.stringify({
      format: learningBackupFormat,
      formatVersion: learningBackupFormatVersion,
      appVersion: '0.1.0',
      createdAt: '2026-08-31T12:00:00.000Z',
      sessions: [],
    }),
    'utf8',
  );
  let confirmation;
  const { handlers, imported } = setup({
    dialogs: {
      async showOpenDialog() {
        return { canceled: false, filePaths: [path] };
      },
      async showMessageBox(options) {
        confirmation = options;
        return { response: 1 };
      },
    },
  });

  assert.deepEqual(await handlers.get('learning:restore-data')({}), {
    ok: true,
    data: { status: 'restored', imported: 0, skipped: 0 },
  });
  assert.deepEqual(imported(), []);
  assert.equal(confirmation.defaultId, 0);
  assert.equal(confirmation.cancelId, 0);
  assert.match(confirmation.detail, /API key will not change/);
  await rm(directory, { recursive: true });
});

test('rejects invalid backup content before confirmation or mutation', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-ipc-invalid-'));
  const path = join(directory, 'backup.json');
  await writeFile(path, '{"format":"unknown"}', 'utf8');
  let confirmations = 0;
  const { handlers, imported } = setup({
    dialogs: {
      async showOpenDialog() {
        return { canceled: false, filePaths: [path] };
      },
      async showMessageBox() {
        confirmations += 1;
        return { response: 1 };
      },
    },
  });

  const result = await handlers.get('learning:restore-data')({});
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'invalid_backup');
  assert.equal(confirmations, 0);
  assert.equal(imported(), undefined);
  await rm(directory, { recursive: true });
});
