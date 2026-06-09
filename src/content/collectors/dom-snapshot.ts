/**
 * DOM 快照收集器
 */

import type { DomSnapshot, SnapshotOptions } from '../../shared/devtools-types';

class DomSnapshotCollector {
  private snapshots: DomSnapshot[] = [];
  private maxSnapshots = 5;

  takeSnapshot(options: SnapshotOptions = {}): DomSnapshot {
    const { includeStyles = false, excludeSelectors = [] } = options;

    let html = document.documentElement.outerHTML;

    // 如果需要排除某些元素
    if (excludeSelectors.length > 0) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      excludeSelectors.forEach((selector) => {
        try {
          tempDiv.querySelectorAll(selector).forEach((el) => el.remove());
        } catch {
          // 忽略无效选择器
        }
      });

      html = tempDiv.innerHTML;
    }

    // 如果需要内联样式
    if (includeStyles) {
      html = this.inlineStyles(html);
    }

    const snapshot: DomSnapshot = {
      html,
      timestamp: Date.now(),
      url: window.location.href,
      title: document.title,
    };

    this.snapshots.push(snapshot);

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  private inlineStyles(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    tempDiv.querySelectorAll('*').forEach((el) => {
      try {
        const computed = window.getComputedStyle(el);
        const styleStr = Array.from(computed)
          .map((prop) => `${prop}: ${computed.getPropertyValue(prop)}`)
          .join('; ');

        el.setAttribute('style', styleStr);
      } catch {
        // 忽略无法获取样式的元素
      }
    });

    return tempDiv.innerHTML;
  }

  getSnapshots(): DomSnapshot[] {
    return [...this.snapshots];
  }

  clear(): void {
    this.snapshots = [];
  }

  getLatest(): DomSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }
}

export const domSnapshotCollector = new DomSnapshotCollector();
export { DomSnapshotCollector };
