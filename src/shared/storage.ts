import type { UserConfig } from './types';
import { DEFAULT_CONFIG } from './constants';

class StorageManager {
  private cache: UserConfig | null = null;
  private pendingWrite: Promise<unknown> = Promise.resolve();

  async getConfig(): Promise<UserConfig> {
    if (this.cache) return this.cache;

    try {
      const result = await chrome.storage.local.get('config');
      this.cache = result.config ?? structuredClone(DEFAULT_CONFIG);
    } catch {
      this.cache = structuredClone(DEFAULT_CONFIG);
    }

    return this.cache!;
  }

  async updateConfig(partial: Partial<UserConfig>): Promise<void> {
    // Chain writes to prevent read-modify-write races
    this.pendingWrite = this.pendingWrite.then(async () => {
      // Re-read from storage (not cache) to get latest state
      let current: UserConfig;
      try {
        const result = await chrome.storage.local.get('config');
        current = result.config ?? structuredClone(DEFAULT_CONFIG);
      } catch {
        current = structuredClone(DEFAULT_CONFIG);
      }

      const updated = deepMerge(current, partial);
      await chrome.storage.local.set({ config: updated });
      this.cache = updated;
    });
    return this.pendingWrite.then(() => {});
  }

  async resetConfig(): Promise<void> {
    this.pendingWrite = this.pendingWrite.then(async () => {
      this.cache = structuredClone(DEFAULT_CONFIG);
      await chrome.storage.local.set({ config: this.cache });
    });
    return this.pendingWrite.then(() => {});
  }

  clearCache(): void {
    this.cache = null;
  }
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] === undefined) continue;

    const targetVal = result[key];
    const sourceVal = source[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      (result as Record<string, unknown>)[key] = deepMerge(targetVal, sourceVal);
    } else {
      (result as Record<string, unknown>)[key] = sourceVal;
    }
  }

  return result;
}

export const storage = new StorageManager();
