/**
 * 控制台日志收集器
 */

import type { ConsoleEntry, FilterOptions } from '../../shared/devtools-types';

class ConsoleCollector {
  private entries: ConsoleEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  addEntry(entry: ConsoleEntry): void {
    this.entries.push(entry);

    // 环形缓冲区，超出时删除最旧的
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  getEntries(filter?: FilterOptions): ConsoleEntry[] {
    if (!filter) return [...this.entries];

    return this.entries.filter((entry) => {
      // 文本过滤
      if (filter.text) {
        const searchText = filter.text.toLowerCase();
        const matchesText = entry.args.some((arg) =>
          arg.toLowerCase().includes(searchText)
        );
        if (!matchesText) return false;
      }

      // 级别过滤
      if (filter.level && entry.level !== filter.level) {
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

  getErrorCount(): number {
    return this.entries.filter((e) => e.level === 'error').length;
  }

  getWarningCount(): number {
    return this.entries.filter((e) => e.level === 'warn').length;
  }
}

export const consoleCollector = new ConsoleCollector();
export { ConsoleCollector };
