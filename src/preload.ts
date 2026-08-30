import { contextBridge, ipcRenderer } from 'electron';

import type { ThinkEdgeApi } from './learning/ipc.ts';

const thinkEdgeApi: ThinkEdgeApi = {
  getProviderStatus: () => ipcRenderer.invoke('learning:provider-status'),
  createDiagnosticQuestion: (request) =>
    ipcRenderer.invoke('learning:create-diagnostic-question', request),
  evaluateAttempt: (request) =>
    ipcRenderer.invoke('learning:evaluate-attempt', request),
};

contextBridge.exposeInMainWorld('thinkEdge', thinkEdgeApi);
