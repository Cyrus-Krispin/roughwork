import { randomUUID } from 'node:crypto';
import { lstat, mkdir, rename, rmdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

function recoveryTimestamp(now: Date): string {
  return now.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

export async function preserveLearningDatabaseFiles(
  databasePath: string,
  now = new Date(),
): Promise<string> {
  const recoveryRoot = join(dirname(databasePath), 'recovery');
  const recoveryPath = join(
    recoveryRoot,
    `${recoveryTimestamp(now)}-${randomUUID()}`,
  );
  await mkdir(recoveryRoot, { recursive: true, mode: 0o700 });
  await mkdir(recoveryPath, { mode: 0o700 });

  const moved: Array<{ from: string; to: string }> = [];
  try {
    for (const sourcePath of [
      databasePath,
      `${databasePath}-wal`,
      `${databasePath}-shm`,
    ]) {
      let source;
      try {
        source = await lstat(sourcePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      if (!source.isFile() || source.isSymbolicLink()) {
        throw new Error('Database recovery only accepts regular local files.');
      }
      const destinationPath = join(recoveryPath, basename(sourcePath));
      await rename(sourcePath, destinationPath);
      moved.push({ from: sourcePath, to: destinationPath });
    }

    if (moved.length === 0) {
      throw new Error('No database files were available to preserve.');
    }
    return recoveryPath;
  } catch (error) {
    for (const entry of moved.reverse()) {
      await rename(entry.to, entry.from).catch(() => undefined);
    }
    await rmdir(recoveryPath).catch(() => undefined);
    throw error;
  }
}
