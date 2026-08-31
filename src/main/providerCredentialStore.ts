import { randomUUID } from 'node:crypto';
import {
  access,
  chmod,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';

import type {
  ProviderCredentialSource,
  ProviderStatus,
} from '../learning/ipc.ts';
import { normalizeProviderApiKey } from '../learning/ipc.ts';
import { LearningFailure } from '../learning/errors.ts';

export type ProviderCredential = {
  apiKey: string;
  model: string;
  source: ProviderCredentialSource;
};

export type ProviderCredentialCipher = {
  isAvailable(): Promise<boolean | null>;
  encrypt(value: string): Promise<Buffer>;
  decrypt(value: Buffer): Promise<{ value: string; shouldReEncrypt: boolean }>;
};

type ProviderCredentialStoreOptions = {
  filePath: string;
  cipher: ProviderCredentialCipher;
  environmentKey?: string;
  model: string;
};

type StoredCredential = {
  version: 1;
  encryptedApiKey: string;
};

const unreadableMessage =
  'The saved DeepSeek credential could not be unlocked. Remove it and add the key again.';

function credentialFailure(message: string): LearningFailure {
  return new LearningFailure(
    'credential_failed',
    message,
    'Strata AI could not update the saved key. Check that Keychain is available, then try again.',
  );
}

function decodeStoredCredential(contents: string): Buffer {
  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch {
    throw new Error(unreadableMessage);
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    !('version' in value) ||
    value.version !== 1 ||
    !('encryptedApiKey' in value) ||
    typeof value.encryptedApiKey !== 'string' ||
    value.encryptedApiKey.length === 0 ||
    value.encryptedApiKey.length > 4096 ||
    Object.keys(value).length !== 2 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
      value.encryptedApiKey,
    )
  ) {
    throw new Error(unreadableMessage);
  }

  return Buffer.from(value.encryptedApiKey, 'base64');
}

export class ProviderCredentialStore {
  private readonly filePath: string;
  private readonly cipher: ProviderCredentialCipher;
  private readonly environmentKey: string;
  private readonly model: string;
  private operationTail: Promise<void> = Promise.resolve();

  constructor(options: ProviderCredentialStoreOptions) {
    this.filePath = options.filePath;
    this.cipher = options.cipher;
    try {
      this.environmentKey = options.environmentKey
        ? normalizeProviderApiKey(options.environmentKey)
        : '';
    } catch {
      this.environmentKey = '';
    }
    this.model = options.model;
  }

  async getStatus(): Promise<ProviderStatus> {
    return this.runOperation(() => this.getStatusUnlocked());
  }

  async getCredential(): Promise<ProviderCredential | null> {
    return this.runOperation(() => this.getCredentialUnlocked());
  }

  async save(apiKey: string): Promise<void> {
    return this.runOperation(() => this.saveUnlocked(apiKey));
  }

  async remove(): Promise<void> {
    return this.runOperation(() => this.removeUnlocked());
  }

  private async getStatusUnlocked(): Promise<ProviderStatus> {
    let secureStorageAvailable: boolean | null = false;
    const hasStoredCredential = await this.hasStoredCredential();
    try {
      secureStorageAvailable = await this.cipher.isAvailable();
      const credential = await this.getCredentialUnlocked();
      return {
        configured: Boolean(credential),
        model: this.model,
        source: credential?.source ?? null,
        secureStorageAvailable,
        hasStoredCredential,
      };
    } catch {
      return {
        configured: false,
        model: this.model,
        source: null,
        secureStorageAvailable,
        hasStoredCredential,
        problem: unreadableMessage,
      };
    }
  }

  private async getCredentialUnlocked(): Promise<ProviderCredential | null> {
    const stored = await this.readStoredCredential();
    if (stored) {
      if ((await this.cipher.isAvailable()) === false)
        throw new Error(unreadableMessage);
      try {
        const decrypted = await this.cipher.decrypt(stored);
        const apiKey = normalizeProviderApiKey(decrypted.value);
        if (decrypted.shouldReEncrypt) await this.saveUnlocked(apiKey);
        return { apiKey, model: this.model, source: 'secure_store' };
      } catch {
        throw new Error(unreadableMessage);
      }
    }

    return this.environmentKey
      ? {
          apiKey: this.environmentKey,
          model: this.model,
          source: 'environment',
        }
      : null;
  }

  private async saveUnlocked(apiKey: string): Promise<void> {
    let trimmed: string;
    try {
      trimmed = normalizeProviderApiKey(apiKey);
    } catch {
      throw credentialFailure('The provider credential is invalid.');
    }
    if ((await this.cipher.isAvailable()) === false) {
      throw credentialFailure('Secure storage is unavailable on this device.');
    }

    try {
      const encrypted = await this.cipher.encrypt(trimmed);
      if (encrypted.length === 0) {
        throw new Error('Encryption returned an empty value.');
      }
      await this.writeStoredCredential({
        version: 1,
        encryptedApiKey: encrypted.toString('base64'),
      });
    } catch {
      throw credentialFailure('The provider credential could not be saved.');
    }
  }

  private async removeUnlocked(): Promise<void> {
    try {
      await rm(this.filePath, { force: true });
    } catch {
      throw credentialFailure('The provider credential could not be removed.');
    }
  }

  private async readStoredCredential(): Promise<Buffer | null> {
    try {
      return decodeStoredCredential(await readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return null;
      }
      throw error;
    }
  }

  private async writeStoredCredential(value: StoredCredential): Promise<void> {
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporaryPath, JSON.stringify(value), {
        encoding: 'utf8',
        mode: 0o600,
        flag: 'wx',
      });
      await rename(temporaryPath, this.filePath);
      await chmod(this.filePath, 0o600);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }

  private async hasStoredCredential(): Promise<boolean> {
    try {
      await access(this.filePath);
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return false;
      }
      return true;
    }
  }

  private runOperation<T>(work: () => Promise<T>): Promise<T> {
    const operation = this.operationTail.then(work, work);
    this.operationTail = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }
}
