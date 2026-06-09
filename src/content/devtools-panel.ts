/**
 * DevTools 面板 UI
 * 类似浏览器 F12 的面板，显示 console/network/errors 快照等信息
 */

import type { ConsoleEntry, NetworkEntry, ErrorEntry, DomSnapshot } from '../shared/devtools-types';

const PANEL_ID = 'ei-devtools-panel';

// 面板样式
const STYLES = `
  :host {
    all: initial;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 300px;
    min-height: 150px;
    max-height: 70vh;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    border-top: 1px solid #333;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    resize: vertical;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    background: #2d2d2d;
    border-bottom: 1px solid #333;
    padding: 0 8px;
    height: 32px;
    flex-shrink: 0;
  }

  .panel-tabs {
    display: flex;
    gap: 2px;
    flex: 1;
  }

  .panel-tab {
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 4px 4px 0 0;
    background: transparent;
    color: #888;
    border: none;
    font-size: 12px;
    font-family: inherit;
    transition: all 0.15s;
  }

  .panel-tab:hover {
    background: #3d3d3d;
    color: #fff;
  }

  .panel-tab.active {
    background: #1e1e1e;
    color: #fff;
  }

  .panel-tab .badge {
    background: #f44336;
    color: white;
    padding: 1px 5px;
    border-radius: 8px;
    font-size: 10px;
    margin-left: 4px;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .panel-btn {
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: inherit;
  }

  .panel-btn:hover {
    background: #3d3d3d;
    color: #fff;
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    padding: 8px;
  }

  .panel-status {
    background: #2d2d2d;
    border-top: 1px solid #333;
    padding: 4px 8px;
    font-size: 11px;
    color: #888;
    flex-shrink: 0;
  }

  /* Console 样式 */
  .console-entry {
    padding: 4px 8px;
    border-bottom: 1px solid #333;
    display: flex;
    gap: 8px;
    cursor: pointer;
  }

  .console-entry:hover {
    background: #2d2d2d;
  }

  .console-timestamp {
    color: #888;
    flex-shrink: 0;
  }

  .console-level {
    width: 50px;
    flex-shrink: 0;
    font-weight: bold;
  }

  .console-level.log { color: #888; }
  .console-level.info { color: #4fc3f7; }
  .console-level.warn { color: #ffb74d; }
  .console-level.error { color: #f44336; }
  .console-level.debug { color: #9c27b0; }

  .console-message {
    flex: 1;
    word-break: break-all;
  }

  /* Network 样式 */
  .network-table {
    width: 100%;
    border-collapse: collapse;
  }

  .network-table th {
    background: #2d2d2d;
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid #333;
    position: sticky;
    top: 0;
  }

  .network-table td {
    padding: 4px 8px;
    border-bottom: 1px solid #333;
  }

  .network-table tr:hover {
    background: #2d2d2d;
  }

  .network-method {
    font-weight: bold;
  }

  .network-method.GET { color: #4caf50; }
  .network-method.POST { color: #2196f3; }
  .network-method.PUT { color: #ff9800; }
  .network-method.DELETE { color: #f44336; }

  .network-status {
    font-weight: bold;
  }

  .network-status.success { color: #4caf50; }
  .network-status.redirect { color: #2196f3; }
  .network-status.client-error { color: #ff9800; }
  .network-status.server-error { color: #f44336; }

  .network-url {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Error 样式 */
  .error-entry {
    padding: 8px;
    border-bottom: 1px solid #333;
    cursor: pointer;
  }

  .error-entry:hover {
    background: #2d2d2d;
  }

  .error-message {
    color: #f44336;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .error-source {
    color: #888;
    font-size: 11px;
  }

  .error-stack {
    margin-top: 4px;
    padding: 8px;
    background: #1a1a1a;
    border-radius: 4px;
    white-space: pre-wrap;
    font-size: 11px;
    display: none;
  }

  .error-entry.expanded .error-stack {
    display: block;
  }

  /* DOM Snapshot 样式 */
  .snapshot-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .snapshot-btn {
    background: #0d47a1;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: inherit;
  }

  .snapshot-btn:hover {
    background: #1565c0;
  }

  .snapshot-preview {
    background: #1a1a1a;
    padding: 12px;
    border-radius: 4px;
    overflow: auto;
    max-height: 200px;
  }

  .snapshot-preview pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* 空状态 */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
    font-style: italic;
  }

  /* 搜索框 */
  .search-box {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .search-input {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #d4d4d4;
    padding: 6px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-family: inherit;
  }

  .search-input:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

export class DevToolsPanel {
  private host: HTMLElement | null = null;
  private shadow: ShadowRoot | null = null;
  private activeTab: 'console' | 'network' | 'errors' | 'snapshot' = 'console';
  private visible = false;

  constructor() {
    this.createPanel();
  }

  private createPanel(): void {
    // 移除已存在的面板
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();

    // 创建 host 元素
    this.host = document.createElement('div');
    this.host.id = PANEL_ID;
    this.host.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; height: 300px; z-index: 2147483647;';

    // 创建 Shadow DOM
    this.shadow = this.host.attachShadow({ mode: 'closed' });

    // 注入样式
    const style = document.createElement('style');
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    // 创建面板内容
    this.render();
    document.body.appendChild(this.host);
  }

  private render(): void {
    if (!this.shadow) return;

    this.shadow.innerHTML = `
      <style>${STYLES}</style>
      <div class="panel-header">
        <div class="panel-tabs">
          <button class="panel-tab ${this.activeTab === 'console' ? 'active' : ''}" data-tab="console">
            Console <span class="badge" id="console-badge">0</span>
          </button>
          <button class="panel-tab ${this.activeTab === 'network' ? 'active' : ''}" data-tab="network">
            Network <span class="badge" id="network-badge">0</span>
          </button>
          <button class="panel-tab ${this.activeTab === 'errors' ? 'active' : ''}" data-tab="errors">
            Errors <span class="badge" id="errors-badge">0</span>
          </button>
          <button class="panel-tab ${this.activeTab === 'snapshot' ? 'active' : ''}" data-tab="snapshot">
            DOM Snapshot
          </button>
        </div>
        <div class="panel-actions">
          <button class="panel-btn" id="clear-btn">Clear</button>
          <button class="panel-btn" id="copy-btn">Copy All</button>
          <button class="panel-btn" id="close-btn">✕</button>
        </div>
      </div>
      <div class="panel-content" id="panel-content">
        <div class="empty-state">No data captured yet</div>
      </div>
      <div class="panel-status">
        <span id="status-text">Ready</span>
      </div>
    `;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.shadow) return;

    // Tab 切换
    this.shadow.querySelectorAll('.panel-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.activeTab = (tab as HTMLElement).dataset.tab as any;
        this.render();
        this.loadData();
      });
    });

    // 关闭按钮
    this.shadow.getElementById('close-btn')?.addEventListener('click', () => {
      this.hide();
    });

    // 清除按钮
    this.shadow.getElementById('clear-btn')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'CLEAR_DEVTOOLS_DATA',
        payload: { type: this.activeTab === 'snapshot' ? 'all' : this.activeTab },
      });
      this.loadData();
    });

    // 复制按钮
    this.shadow.getElementById('copy-btn')?.addEventListener('click', () => {
      this.copyAllData();
    });
  }

  private loadData(): void {
    if (this.activeTab === 'snapshot') {
      this.renderSnapshotTab();
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'GET_DEVTOOLS_DATA',
        payload: { type: this.activeTab },
      },
      (response: any) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load devtools data:', chrome.runtime.lastError);
          return;
        }

        if (response?.payload) {
          this.renderData(response.payload);
        }
      }
    );
  }

  private renderData(data: any): void {
    if (!this.shadow) return;

    const content = this.shadow.getElementById('panel-content');
    if (!content) return;

    switch (this.activeTab) {
      case 'console':
        this.renderConsole(content, data.console || []);
        break;
      case 'network':
        this.renderNetwork(content, data.network || []);
        break;
      case 'errors':
        this.renderErrors(content, data.errors || []);
        break;
    }

    this.updateBadges(data);
  }

  private renderConsole(container: HTMLElement, entries: ConsoleEntry[]): void {
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No console logs</div>';
      return;
    }

    container.innerHTML = entries
      .map(
        (entry) => `
        <div class="console-entry" data-id="${entry.id}">
          <span class="console-timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</span>
          <span class="console-level ${entry.level}">${entry.level.toUpperCase()}</span>
          <span class="console-message">${this.escapeHtml(entry.args.join(' '))}</span>
        </div>
      `
      )
      .join('');
  }

  private renderNetwork(container: HTMLElement, entries: NetworkEntry[]): void {
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No network requests</div>';
      return;
    }

    container.innerHTML = `
      <table class="network-table">
        <thead>
          <tr>
            <th>Method</th>
            <th>URL</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          ${entries
            .map(
              (entry) => `
              <tr>
                <td><span class="network-method ${entry.method}">${entry.method}</span></td>
                <td class="network-url" title="${this.escapeHtml(entry.url)}">${this.escapeHtml(entry.url)}</td>
                <td><span class="network-status ${this.getStatusClass(entry.statusCode)}">${entry.statusCode}</span></td>
                <td>${entry.duration}ms</td>
                <td>${this.formatSize(entry.size)}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  private renderErrors(container: HTMLElement, entries: ErrorEntry[]): void {
    if (entries.length === 0) {
      container.innerHTML = '<div class="empty-state">No errors</div>';
      return;
    }

    container.innerHTML = entries
      .map(
        (entry) => `
        <div class="error-entry" data-id="${entry.id}">
          <div class="error-message">${this.escapeHtml(entry.message)}</div>
          <div class="error-source">${entry.source}:${entry.lineno}:${entry.colno}</div>
          <div class="error-stack">${this.escapeHtml(entry.stackTrace || 'No stack trace')}</div>
        </div>
      `
      )
      .join('');

    // 添加展开/折叠功能
    container.querySelectorAll('.error-entry').forEach((el) => {
      el.addEventListener('click', () => {
        el.classList.toggle('expanded');
      });
    });
  }

  private renderSnapshotTab(): void {
    if (!this.shadow) return;

    const content = this.shadow.getElementById('panel-content');
    if (!content) return;

    content.innerHTML = `
      <div class="snapshot-actions">
        <button class="snapshot-btn" id="capture-btn">Capture Snapshot</button>
        <button class="snapshot-btn" id="copy-html-btn">Copy HTML</button>
        <button class="snapshot-btn" id="download-btn">Download HTML</button>
      </div>
      <div class="snapshot-preview">
        <pre id="snapshot-preview">Click "Capture Snapshot" to capture the current DOM</pre>
      </div>
    `;

    // 绑定事件
    this.shadow.getElementById('capture-btn')?.addEventListener('click', () => {
      this.captureSnapshot();
    });

    this.shadow.getElementById('copy-html-btn')?.addEventListener('click', () => {
      this.copySnapshotHtml();
    });

    this.shadow.getElementById('download-btn')?.addEventListener('click', () => {
      this.downloadSnapshot();
    });
  }

  private captureSnapshot(): void {
    chrome.runtime.sendMessage(
      {
        type: 'TAKE_DOM_SNAPSHOT',
        payload: { options: {} },
      },
      (response: any) => {
        if (response?.payload?.snapshot) {
          const preview = this.shadow?.getElementById('snapshot-preview');
          if (preview) {
            preview.textContent = response.payload.snapshot.html;
          }
        }
      }
    );
  }

  private copySnapshotHtml(): void {
    const preview = this.shadow?.getElementById('snapshot-preview');
    if (preview) {
      navigator.clipboard.writeText(preview.textContent || '');
    }
  }

  private downloadSnapshot(): void {
    const preview = this.shadow?.getElementById('snapshot-preview');
    if (preview) {
      const blob = new Blob([preview.textContent || ''], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dom-snapshot-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  private updateBadges(data: any): void {
    if (!this.shadow) return;

    const consoleBadge = this.shadow.getElementById('console-badge');
    const networkBadge = this.shadow.getElementById('network-badge');
    const errorsBadge = this.shadow.getElementById('errors-badge');

    if (consoleBadge) consoleBadge.textContent = String(data.console?.length || 0);
    if (networkBadge) networkBadge.textContent = String(data.network?.length || 0);
    if (errorsBadge) errorsBadge.textContent = String(data.errors?.length || 0);
  }

  private copyAllData(): void {
    chrome.runtime.sendMessage(
      {
        type: 'GET_DEVTOOLS_DATA',
        payload: { type: 'all' },
      },
      (response: any) => {
        if (response?.payload) {
          const text = JSON.stringify(response.payload, null, 2);
          navigator.clipboard.writeText(text);
        }
      }
    );
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getStatusClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'redirect';
    if (statusCode >= 400 && statusCode < 500) return 'client-error';
    if (statusCode >= 500) return 'server-error';
    return '';
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  show(): void {
    this.visible = true;
    if (this.host) {
      this.host.style.display = 'block';
      this.loadData();
    }
  }

  hide(): void {
    this.visible = false;
    if (this.host) {
      this.host.style.display = 'none';
    }
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  destroy(): void {
    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
    }
  }
}

// 单例实例
let panelInstance: DevToolsPanel | null = null;

export function getDevToolsPanel(): DevToolsPanel {
  if (!panelInstance) {
    panelInstance = new DevToolsPanel();
  }
  return panelInstance;
}

export function destroyDevToolsPanel(): void {
  if (panelInstance) {
    panelInstance.destroy();
    panelInstance = null;
  }
}
