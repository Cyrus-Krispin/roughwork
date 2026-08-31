import assert from 'node:assert/strict';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { preserveLearningDatabaseFiles } from '../src/main/databaseRecovery.ts';

async function missing(path) {
  await assert.rejects(lstat(path), { code: 'ENOENT' });
}

test('preserves the database and existing sidecars in one private folder', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-recovery-test-'));
  const databasePath = join(directory, 'strata-ai.sqlite3');
  await Promise.all([
    writeFile(databasePath, 'database'),
    writeFile(`${databasePath}-wal`, 'wal'),
    writeFile(`${databasePath}-shm`, 'shm'),
  ]);

  const recoveryPath = await preserveLearningDatabaseFiles(
    databasePath,
    new Date('2026-08-31T12:00:00.000Z'),
  );

  assert.equal((await stat(recoveryPath)).mode & 0o777, 0o700);
  assert.equal(
    await readFile(join(recoveryPath, 'strata-ai.sqlite3'), 'utf8'),
    'database',
  );
  assert.equal(
    await readFile(join(recoveryPath, 'strata-ai.sqlite3-wal'), 'utf8'),
    'wal',
  );
  assert.equal(
    await readFile(join(recoveryPath, 'strata-ai.sqlite3-shm'), 'utf8'),
    'shm',
  );
  await Promise.all([
    missing(databasePath),
    missing(`${databasePath}-wal`),
    missing(`${databasePath}-shm`),
  ]);
  await rm(directory, { recursive: true });
});

test('preserves a database when sidecars are absent', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-recovery-test-'));
  const databasePath = join(directory, 'strata-ai.sqlite3');
  await writeFile(databasePath, 'database');

  const recoveryPath = await preserveLearningDatabaseFiles(databasePath);
  assert.deepEqual(await readdir(recoveryPath), ['strata-ai.sqlite3']);
  await rm(directory, { recursive: true });
});

test('rejects unsafe files and rolls back files already moved', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-recovery-test-'));
  const databasePath = join(directory, 'strata-ai.sqlite3');
  await writeFile(databasePath, 'database');
  await mkdir(`${databasePath}-wal`);

  await assert.rejects(
    preserveLearningDatabaseFiles(databasePath),
    /regular local files/i,
  );
  assert.equal(await readFile(databasePath, 'utf8'), 'database');
  assert.equal((await stat(`${databasePath}-wal`)).isDirectory(), true);
  await rm(directory, { recursive: true });
});

test('rejects symlinks and leaves no empty recovery leaf when nothing moves', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'strata-recovery-test-'));
  const databasePath = join(directory, 'strata-ai.sqlite3');
  const targetPath = join(directory, 'target.sqlite3');
  await writeFile(targetPath, 'database');
  await symlink(targetPath, databasePath);
  await assert.rejects(
    preserveLearningDatabaseFiles(databasePath),
    /regular local files/i,
  );
  assert.deepEqual(await readdir(join(directory, 'recovery')), []);

  await rm(databasePath);
  await assert.rejects(
    preserveLearningDatabaseFiles(databasePath),
    /no database files/i,
  );
  assert.deepEqual(await readdir(join(directory, 'recovery')), []);
  await rm(directory, { recursive: true });
});
