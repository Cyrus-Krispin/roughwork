import type { StrataAiApi } from './learning/ipc.ts';

declare global {
  interface Window {
    strataAi: StrataAiApi;
  }
}

export {};
