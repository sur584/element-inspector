/**
 * JavaScript 错误收集器
 */

import type { ErrorEntry, FilterOptions } from '../../shared/devtools-types';

class ErrorCollector {
  private entries: ErrorEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  addEntry(entry: ErrorEntry): void {
    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(filter?: FilterOptions): ErrorEntry[] {
    if (!filter) return [...this.entries];

    return this.entries.filter((entry) => {
      // 文本过滤
      if (filter.text) {
        const searchText = filter.text.toLowerCase();
        if (!entry.message.toLowerCase().includes(searchText)) {
          return false;
        }
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

  getDuplicateErrors(): Map<string, number> {
    const counts = new Map<string, number>();

    this.entries.forEach((entry) => {
      const key = `${entry.message}:${entry.source}:${entry.lineno}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }
}

export const errorCollector = new ErrorCollector();
export { ErrorCollector };
