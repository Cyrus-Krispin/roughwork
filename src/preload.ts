import { contextBridge, ipcRenderer } from 'electron';

import type { StrataAiApi } from './learning/ipc.ts';

const strataAiApi: StrataAiApi = {
  getProviderStatus: () => ipcRenderer.invoke('learning:provider-status'),
  startSession: (request) =>
    ipcRenderer.invoke('learning:start-session', request),
  submitAttempt: (request) =>
    ipcRenderer.invoke('learning:submit-attempt', request),
  requestHelp: (request) =>
    ipcRenderer.invoke('learning:request-help', request),
  challengeEvaluation: (request) =>
    ipcRenderer.invoke('learning:challenge-evaluation', request),
  getSession: (request) => ipcRenderer.invoke('learning:get-session', request),
  listSessions: (request = {}) =>
    ipcRenderer.invoke('learning:list-sessions', request),
  endSession: (request) => ipcRenderer.invoke('learning:end-session', request),
  deleteSession: (request) =>
    ipcRenderer.invoke('learning:delete-session', request),
};

contextBridge.exposeInMainWorld('strataAi', strataAiApi);
