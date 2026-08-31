import {
  parseProviderCredentialRequest,
  toPublicLearningError,
  type LearningResult,
  type ProviderStatus,
} from '../learning/ipc.ts';

type IpcHandler = (event: unknown, value?: unknown) => unknown;

type IpcRegistrar = {
  handle(channel: string, handler: IpcHandler): void;
};

type ProviderCredentialOperations = {
  getStatus(): Promise<ProviderStatus>;
  save(apiKey: string): Promise<void>;
  remove(): Promise<void>;
};

type ProviderIpcDependencies = {
  credentials: ProviderCredentialOperations;
  assertTrusted(event: unknown): void;
  openExternal(url: string): Promise<unknown>;
};

async function providerResult<T>(
  work: () => Promise<T>,
): Promise<LearningResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (error) {
    return { ok: false, error: toPublicLearningError(error) };
  }
}

export function registerProviderIpcHandlers(
  ipc: IpcRegistrar,
  dependencies: ProviderIpcDependencies,
): void {
  ipc.handle('learning:provider-status', (event) => {
    dependencies.assertTrusted(event);
    return dependencies.credentials.getStatus();
  });

  ipc.handle('learning:save-provider-credential', (event, value) => {
    dependencies.assertTrusted(event);
    return providerResult(async () => {
      const request = parseProviderCredentialRequest(value);
      await dependencies.credentials.save(request.apiKey);
      return dependencies.credentials.getStatus();
    });
  });

  ipc.handle('learning:remove-provider-credential', (event) => {
    dependencies.assertTrusted(event);
    return providerResult(async () => {
      await dependencies.credentials.remove();
      return dependencies.credentials.getStatus();
    });
  });

  ipc.handle('learning:open-deepseek-keys', async (event) => {
    dependencies.assertTrusted(event);
    await dependencies.openExternal('https://platform.deepseek.com/api_keys');
  });
}
