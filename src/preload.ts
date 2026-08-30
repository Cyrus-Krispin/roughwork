import { contextBridge, ipcRenderer } from 'electron';

import type { ThinkEdgeApi } from './learning/ipc.ts';

const thinkEdgeApi: ThinkEdgeApi = {
  getProviderStatus: () => ipcRenderer.invoke('learning:provider-status'),
  createDiagnosticQuestion: (request) =>
    ipcRenderer.invoke('learning:create-diagnostic-question', request),
  evaluateAttempt: (request) =>
    ipcRenderer.invoke('learning:evaluate-attempt', request),
  startSession: (request) =>
    ipcRenderer.invoke('learning:start-session', request),
  submitAttempt: (request) =>
    ipcRenderer.invoke('learning:submit-attempt', request),
  getSession: (request) => ipcRenderer.invoke('learning:get-session', request),
  listSessions: (request = {}) =>
    ipcRenderer.invoke('learning:list-sessions', request),
  endSession: (request) => ipcRenderer.invoke('learning:end-session', request),
  deleteSession: (request) =>
    ipcRenderer.invoke('learning:delete-session', request),
};

contextBridge.exposeInMainWorld('thinkEdge', thinkEdgeApi);
