import 'dotenv/config';

import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import started from 'electron-squirrel-startup';

import {
  parseListSessionsRequest,
  parseSessionRequest,
  parseSubmitAttemptRequest,
  parseTopicRequest,
  toPublicLearningError,
  type LearningResult,
} from './learning/ipc.ts';
import { createDeepSeekProviderFromEnvironment } from './main/ai/deepseek.ts';
import { LearningService } from './main/learningService.ts';
import { openLearningDatabase } from './main/persistence/database.ts';
import { LearningSessionRepository } from './main/persistence/sessionRepository.ts';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

if (started) {
  app.quit();
}

function assertTrustedRenderer(event: IpcMainInvokeEvent): void {
  if (event.senderFrame?.url !== MAIN_WINDOW_WEBPACK_ENTRY) {
    throw new Error('Rejected learning request from an untrusted renderer.');
  }
}

async function learningResult<T>(
  work: () => Promise<T> | T,
): Promise<LearningResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, error: toPublicLearningError(error) };
  }
}

function registerLearningHandlers(service: LearningService): void {
  ipcMain.handle('learning:provider-status', (event) => {
    assertTrustedRenderer(event);
    return {
      configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash',
    };
  });

  ipcMain.handle('learning:start-session', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(async () => {
      const request = parseTopicRequest(value);
      return service.startSession(request.topic);
    });
  });

  ipcMain.handle('learning:submit-attempt', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(async () => {
      const request = parseSubmitAttemptRequest(value);
      return service.submitAttempt(request);
    });
  });

  ipcMain.handle('learning:get-session', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(() => {
      const request = parseSessionRequest(value);
      return service.getSession(request.sessionId);
    });
  });

  ipcMain.handle('learning:list-sessions', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(() => {
      const request = parseListSessionsRequest(value);
      return service.listSessions(request.limit);
    });
  });

  ipcMain.handle('learning:end-session', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(() => {
      const request = parseSessionRequest(value);
      return service.endSession(request.sessionId);
    });
  });

  ipcMain.handle('learning:delete-session', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(() => {
      const request = parseSessionRequest(value);
      return service.deleteSession(request.sessionId);
    });
  });
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 720,
    minHeight: 520,
    backgroundColor: '#f7f6f1',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: true,
    },
  });

  void mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
}

let learningDatabase: DatabaseSync | null = null;

void app.whenReady().then(() => {
  learningDatabase = openLearningDatabase(
    join(app.getPath('userData'), 'strata-ai.sqlite3'),
  );
  const repository = new LearningSessionRepository(learningDatabase);
  const service = new LearningService(
    repository,
    createDeepSeekProviderFromEnvironment,
  );
  registerLearningHandlers(service);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  learningDatabase?.close();
  learningDatabase = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
