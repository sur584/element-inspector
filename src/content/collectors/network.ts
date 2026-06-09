/**
 * 网络请求收集器
 */

import type { NetworkEntry, FilterOptions } from '../../shared/devtools-types';

class NetworkCollector {
  private entries: NetworkEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  addEntry(entry: NetworkEntry): void {
    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(filter?: FilterOptions): NetworkEntry[] {
    if (!filter) return [...this.entries];

    return this.entries.filter((entry) => {
      // URL 过滤
      if (filter.url) {
        const searchUrl = filter.url.toLowerCase();
        if (!entry.url.toLowerCase().includes(searchUrl)) {
          return false;
        }
      }

      // 方法过滤
      if (filter.method && entry.method !== filter.method) {
        return false;
      }

      // 状态码过滤
      if (filter.statusCode && entry.statusCode !== filter.statusCode) {
        return false;
      }

      return true;
    });
  }

  clear(): void {
    this.entries = [];
  }

  getCount(): number {
    return this.entries.length;
  }

  getStats(): { total: number; pending: number; success: number; error: number } {
    const pending = this.entries.filter((e) => e.statusCode === 0).length;
    const success = this.entries.filter((e) => e.statusCode >= 200 && e.statusCode < 400).length;
    const error = this.entries.filter((e) => e.statusCode >= 400).length;

    return {
      total: this.entries.length,
      pending,
      success,
      error,
    };
  }
}

export const networkCollector = new NetworkCollector();
export { NetworkCollector };
