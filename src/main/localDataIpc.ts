import {
  learningBackupFormat,
  learningBackupFormatVersion,
  toLocalDataSession,
  type LocalDataOperationResult,
  type ExportLearningDataResult,
  type RestoreLearningDataResult,
} from '../learning/localData.ts';
import type { PersistedLearningSession } from '../learning/history.ts';
import {
  readLearningBackup,
  writeLearningBackup,
} from './localDataFileService.ts';

type IpcRegistrar = {
  handle(channel: string, listener: (event: unknown) => Promise<unknown>): void;
};

type NativeDialogs = {
  showSaveDialog(options: {
    title: string;
    defaultPath: string;
    filters: Array<{ name: string; extensions: string[] }>;
  }): Promise<{ canceled: boolean; filePath?: string }>;
  showOpenDialog(options: {
    title: string;
    properties: ['openFile'];
    filters: Array<{ name: string; extensions: string[] }>;
  }): Promise<{ canceled: boolean; filePaths: string[] }>;
  showMessageBox(options: {
    type: 'question';
    title: string;
    message: string;
    detail: string;
    buttons: [string, string];
    defaultId: number;
    cancelId: number;
    noLink: true;
  }): Promise<{ response: number }>;
};

type LocalDataRepository = {
  listAllSessions(): PersistedLearningSession[];
  importSessions(sessions: ReturnType<typeof toLocalDataSession>[]): {
    imported: number;
    skipped: number;
  };
};

export function registerLocalDataIpcHandlers(
  ipc: IpcRegistrar,
  options: {
    dialogs: NativeDialogs;
    repository: LocalDataRepository;
    assertTrusted(event: unknown): void;
    appVersion: string;
    now?: () => Date;
  },
): void {
  const now = options.now ?? (() => new Date());

  ipc.handle('learning:export-data', async (event) => {
    options.assertTrusted(event);
    const createdAt = now();
    const sessions = options.repository
      .listAllSessions()
      .map(toLocalDataSession);
    const selected = await options.dialogs.showSaveDialog({
      title: 'Export Strata AI backup',
      defaultPath: `strata-ai-backup-${createdAt.toISOString().slice(0, 10)}.strata-backup.json`,
      filters: [{ name: 'Strata AI backup', extensions: ['json'] }],
    });
    if (selected.canceled || !selected.filePath) {
      return {
        ok: true,
        data: { status: 'cancelled' },
      } satisfies LocalDataOperationResult<ExportLearningDataResult>;
    }

    try {
      await writeLearningBackup(selected.filePath, {
        format: learningBackupFormat,
        formatVersion: learningBackupFormatVersion,
        appVersion: options.appVersion,
        createdAt: createdAt.toISOString(),
        sessions,
      });
      return {
        ok: true,
        data: { status: 'saved', sessionCount: sessions.length },
      } satisfies LocalDataOperationResult<ExportLearningDataResult>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'export_failed',
          message:
            "The backup couldn't be saved. Your local history is unchanged.",
        },
      } satisfies LocalDataOperationResult<ExportLearningDataResult>;
    }
  });

  ipc.handle('learning:restore-data', async (event) => {
    options.assertTrusted(event);
    const selected = await options.dialogs.showOpenDialog({
      title: 'Restore Strata AI backup',
      properties: ['openFile'],
      filters: [{ name: 'Strata AI backup', extensions: ['json'] }],
    });
    if (selected.canceled || selected.filePaths.length !== 1) {
      return {
        ok: true,
        data: { status: 'cancelled' },
      } satisfies LocalDataOperationResult<RestoreLearningDataResult>;
    }

    let backup;
    try {
      backup = await readLearningBackup(selected.filePaths[0]!);
    } catch {
      return {
        ok: false,
        error: {
          code: 'invalid_backup',
          message:
            "This backup couldn't be read. Your current history is unchanged.",
        },
      } satisfies LocalDataOperationResult<RestoreLearningDataResult>;
    }

    const confirmation = await options.dialogs.showMessageBox({
      type: 'question',
      title: 'Restore learning history?',
      message: `Restore ${backup.sessions.length} ${backup.sessions.length === 1 ? 'session' : 'sessions'}?`,
      detail: `This backup was created ${new Date(backup.createdAt).toLocaleString()}. Existing sessions will not be changed, and your API key will not change.`,
      buttons: ['Cancel', 'Restore backup'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (confirmation.response !== 1) {
      return {
        ok: true,
        data: { status: 'cancelled' },
      } satisfies LocalDataOperationResult<RestoreLearningDataResult>;
    }

    try {
      const result = options.repository.importSessions(backup.sessions);
      return {
        ok: true,
        data: { status: 'restored', ...result },
      } satisfies LocalDataOperationResult<RestoreLearningDataResult>;
    } catch {
      return {
        ok: false,
        error: {
          code: 'restore_failed',
          message:
            "This backup conflicts with current history and wasn't restored. Your current history is unchanged.",
        },
      } satisfies LocalDataOperationResult<RestoreLearningDataResult>;
    }
  });
}
