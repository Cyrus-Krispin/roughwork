import type { ThinkEdgeApi } from './learning/ipc.ts';

declare global {
  interface Window {
    thinkEdge: ThinkEdgeApi;
  }
}

export {};
