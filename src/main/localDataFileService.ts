import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import {
  learningBackupSchema,
  type LearningBackup,
} from '../learning/localData.ts';

const maximumBackupBytes = 50 * 1024 * 1024;

export async function writeLearningBackup(
  path: string,
  backup: LearningBackup,
): Promise<void> {
  const validated = learningBackupSchema.parse(backup);
  const serialized = `${JSON.stringify(validated, null, 2)}\n`;
  if (Buffer.byteLength(serialized, 'utf8') > maximumBackupBytes) {
    throw new Error('Backup exceeds the supported size limit.');
  }
  const temporaryPath = join(
    dirname(path),
    `.strata-backup-${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(serialized, 'utf8');
    await handle.sync();
    await handle.close();
    handle = undefined;
    await rename(temporaryPath, path);
  } catch (error) {
    await handle?.close().catch(() => undefined);
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

export async function readLearningBackup(
  path: string,
): Promise<LearningBackup> {
  let handle;
  try {
    try {
      handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ELOOP') {
        throw new Error('Backup is not a supported regular file.');
      }
      throw error;
    }
    const file = await handle.stat();
    if (!file.isFile() || file.size > maximumBackupBytes) {
      throw new Error('Backup is not a supported regular file.');
    }
    const buffer = Buffer.alloc(file.size + 1);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead !== file.size) {
      throw new Error('Backup changed while it was being read.');
    }
    const value: unknown = JSON.parse(buffer.subarray(0, bytesRead).toString());
    return learningBackupSchema.parse(value);
  } finally {
    await handle?.close().catch(() => undefined);
  }
}
