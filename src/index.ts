import 'dotenv/config';

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import started from 'electron-squirrel-startup';

import {
  parseAttemptRequest,
  parseTopicRequest,
  toPublicLearningError,
  type LearningResult,
} from './learning/ipc.ts';
import { createDeepSeekProviderFromEnvironment } from './main/ai/deepseek.ts';

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
  work: () => Promise<T>,
): Promise<LearningResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, error: toPublicLearningError(error) };
  }
}

function registerLearningHandlers(): void {
  ipcMain.handle('learning:provider-status', (event) => {
    assertTrustedRenderer(event);
    return {
      configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash',
    };
  });

  ipcMain.handle('learning:create-diagnostic-question', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(async () => {
      const request = parseTopicRequest(value);
      return createDeepSeekProviderFromEnvironment().createDiagnosticQuestion(
        request.topic,
      );
    });
  });

  ipcMain.handle('learning:evaluate-attempt', (event, value) => {
    assertTrustedRenderer(event);
    return learningResult(async () => {
      const request = parseAttemptRequest(value);
      return createDeepSeekProviderFromEnvironment().evaluateAttempt(request);
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

void app.whenReady().then(() => {
  registerLearningHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
