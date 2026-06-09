/**
 * Element Inspector - Content Script Entry Point
 *
 * Orchestrates the inspector lifecycle:
 * - Listens for messages from the background/popup
 * - Reads and reacts to configuration changes
 * - Toggles the inspector and overlay on/off
 */

import type { UserConfig, Message } from '../shared/types';
import type { InjectedMessage, ConsoleEntry, NetworkEntry, ErrorEntry } from '../shared/devtools-types';
import { DEFAULT_CONFIG } from '../shared/constants';
import { storage } from '../shared/storage';
import { initInspector, destroyInspector, updateInspectorConfig } from './inspector';
import { initOverlay, destroyOverlay } from './overlay';
import { consoleCollector } from './collectors/console';
import { networkCollector } from './collectors/network';
import { errorCollector } from './collectors/errors';
import { domSnapshotCollector } from './collectors/dom-snapshot';
import { getDevToolsPanel, destroyDevToolsPanel } from './devtools-panel';

// --- State ---
let currentConfig: UserConfig = structuredClone(DEFAULT_CONFIG);
let inspectorActive = false;
let devtoolsPanelVisible = false;
let globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;
let toastTimer: number | null = null;
let injectScriptLoaded = false;

// --- Standalone Toast (独立于 overlay，关闭检查器后仍可显示) ---

function showStatusToast(message: string): void {
  // 移除旧的
  const old = document.getElementById('ei-status-toast');
  if (old) old.remove();
  if (toastTimer !== null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  const toast = document.createElement('div');
  toast.id = 'ei-status-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
    background: 'rgba(0, 0, 0, 0.75)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: '2147483647',
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
    opacity: '0',
  });
  document.body.appendChild(toast);

  // 触发入场动画
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  toastTimer = window.setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
    toastTimer = null;
  }, 1500);
}

// --- Initialization ---

/**
 * Bootstrap the content script.
 * Reads stored config and sets up message / storage listeners.
 */
async function bootstrap(): Promise<void> {
  // Read initial config (but don't auto-activate — each tab starts inactive)
  currentConfig = await storage.getConfig();
  currentConfig.enabled = false;

  // Listen for messages from background / popup
  chrome.runtime.onMessage.addListener(handleMessage);

  // Listen for storage changes (config updates only, not activation)
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Global keyboard shortcuts (always active)
  installGlobalShortcuts();

  // 初始化 DevTools 功能
  if (currentConfig.devtools?.enabled) {
    injectDevToolsScript();
    setupDevToolsListeners();
  }
}

// --- DevTools 功能 ---

/**
 * 注入页面脚本以捕获 console/network/errors
 */
function injectDevToolsScript(): void {
  if (injectScriptLoaded) return;

  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('inject.js');
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);

  injectScriptLoaded = true;
}

/**
 * 设置 DevTools 事件监听器
 */
function setupDevToolsListeners(): void {
  window.addEventListener('message', (event: MessageEvent<InjectedMessage>) => {
    // 验证消息来源
    if (event.source !== window) return;
    if (!event.data || typeof event.data !== 'object') return;

    const { type, data } = event.data;

    switch (type) {
      case 'console':
        consoleCollector.addEntry(data as ConsoleEntry);
        break;
      case 'network':
        networkCollector.addEntry(data as NetworkEntry);
        break;
      case 'error':
      case 'unhandledrejection':
        errorCollector.addEntry(data as ErrorEntry);
        break;
    }
  });
}

/**
 * 处理 DevTools 面板切换
 */
function toggleDevToolsPanel(visible?: boolean): void {
  const panel = getDevToolsPanel();

  if (visible === undefined) {
    panel.toggle();
  } else if (visible) {
    panel.show();
  } else {
    panel.hide();
  }

  devtoolsPanelVisible = panel.isVisible();
}

// --- Message Handler ---

function handleMessage(
  message: Message<unknown>,
  _sender: chrome.runtime.MessageSender,
  _sendResponse: (response?: unknown) => void,
): void {
  switch (message.type) {
    case 'TOGGLE_INSPECTOR': {
      const payload = message.payload as { enabled?: boolean } | undefined;
      if (payload && typeof payload.enabled === 'boolean') {
        currentConfig.enabled = payload.enabled;
      } else {
        // Toggle if no explicit value
        currentConfig.enabled = !currentConfig.enabled;
      }

      if (currentConfig.enabled) {
        activateInspector();
      } else {
        deactivateInspector();
      }
      break;
    }

    case 'UPDATE_CONFIG': {
      const partial = message.payload as Partial<UserConfig>;
      if (partial) {
        currentConfig = mergeConfig(currentConfig, partial);
        if (inspectorActive) {
          updateInspectorConfig(currentConfig);
        }
      }
      break;
    }

    case 'GET_STATE': {
      // Respond with current state if needed
      // sendResponse is not used here because the listener returns false
      break;
    }

    case 'TOGGLE_DEVTOOLS_PANEL': {
      const panelPayload = message.payload as { visible?: boolean } | undefined;
      toggleDevToolsPanel(panelPayload?.visible);
      break;
    }

    case 'GET_DEVTOOLS_DATA': {
      const dataPayload = message.payload as { type?: string; filter?: any } | undefined;
      if (dataPayload?.type) {
        let data: any = {};
        switch (dataPayload.type) {
          case 'console':
            data.console = consoleCollector.getEntries(dataPayload.filter);
            break;
          case 'network':
            data.network = networkCollector.getEntries(dataPayload.filter);
            break;
          case 'errors':
            data.errors = errorCollector.getEntries(dataPayload.filter);
            break;
          case 'all':
            data.console = consoleCollector.getEntries();
            data.network = networkCollector.getEntries();
            data.errors = errorCollector.getEntries();
            break;
        }
        _sendResponse({ type: 'DEVTOOLS_DATA_RESPONSE', payload: data });
      }
      return true; // 异步响应
    }

    case 'CLEAR_DEVTOOLS_DATA': {
      const clearPayload = message.payload as { type?: string } | undefined;
      switch (clearPayload?.type) {
        case 'console':
          consoleCollector.clear();
          break;
        case 'network':
          networkCollector.clear();
          break;
        case 'errors':
          errorCollector.clear();
          break;
        case 'all':
          consoleCollector.clear();
          networkCollector.clear();
          errorCollector.clear();
          break;
      }
      break;
    }

    case 'TAKE_DOM_SNAPSHOT': {
      const snapshotPayload = message.payload as { options?: any } | undefined;
      const snapshot = domSnapshotCollector.takeSnapshot(snapshotPayload?.options);
      _sendResponse({ type: 'DOM_SNAPSHOT_RESULT', payload: { snapshot } });
      return true;
    }

    case 'UPDATE_DEVTOOLS_CONFIG': {
      const devtoolsPayload = message.payload as { devtools?: any } | undefined;
      if (devtoolsPayload?.devtools) {
        currentConfig.devtools = {
          ...currentConfig.devtools,
          ...devtoolsPayload.devtools,
        };
        // 如果启用了 devtools，注入脚本
        if (currentConfig.devtools.enabled && !injectScriptLoaded) {
          injectDevToolsScript();
          setupDevToolsListeners();
        }
      }
      break;
    }

    default:
      break;
  }
}

// --- Storage Change Handler ---

function handleStorageChange(
  changes: { [key: string]: chrome.storage.StorageChange },
  area: string,
): void {
  if (area !== 'local') return;

  if (changes.config) {
    const newConfig = changes.config.newValue as UserConfig;
    if (!newConfig) return;

    currentConfig = newConfig;

    // Only update config if inspector is active — don't auto-activate/deactivate
    if (inspectorActive) {
      updateInspectorConfig(currentConfig);
    }
  }
}

// --- Inspector Lifecycle ---

function activateInspector(): void {
  if (inspectorActive) return;
  inspectorActive = true;
  initInspector(currentConfig);
}

function deactivateInspector(): void {
  if (!inspectorActive) return;
  inspectorActive = false;
  destroyInspector();
}

/**
 * Enable inspector and sync state to storage.
 */
async function enableInspector(): Promise<void> {
  if (inspectorActive) return;
  currentConfig.enabled = true;
  await storage.updateConfig({ enabled: true });
  activateInspector();
  showStatusToast('✅ 检查器已开启');
}

/**
 * Disable inspector and sync state to storage.
 */
async function disableInspector(): Promise<void> {
  if (!inspectorActive) return;
  currentConfig.enabled = false;
  await storage.updateConfig({ enabled: false });
  deactivateInspector();
  showStatusToast('⛔ 检查器已关闭');
}

// --- Global Keyboard Shortcuts ---

function installGlobalShortcuts(): void {
  globalKeyHandler = (e: KeyboardEvent) => {
    // 忽略输入框中的按键
    const target = e.target as Element;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
      return;
    }

    // 关闭快捷键（从配置读取，支持自定义）
    const closeShortcut = currentConfig.shortcuts?.close || 'Escape';
    if (inspectorActive && matchesShortcut(e, closeShortcut)) {
      e.preventDefault();
      disableInspector();
      return;
    }

    // 切换快捷键（从配置读取，支持自定义）
    const toggleShortcut = currentConfig.shortcuts?.toggle || 'Ctrl+Shift+E';
    if (matchesShortcut(e, toggleShortcut)) {
      e.preventDefault();
      if (inspectorActive) {
        disableInspector();
      } else {
        enableInspector();
      }
      return;
    }
  };
  document.addEventListener('keydown', globalKeyHandler, { capture: true });
}

function parseShortcut(shortcut: string): { ctrl: boolean; alt: boolean; shift: boolean; meta: boolean; key: string } {
  const parts = shortcut.split('+');
  const key = parts[parts.length - 1].toLowerCase();
  return {
    ctrl: parts.slice(0, -1).some((p) => p.toLowerCase() === 'ctrl'),
    alt: parts.slice(0, -1).some((p) => p.toLowerCase() === 'alt'),
    shift: parts.slice(0, -1).some((p) => p.toLowerCase() === 'shift'),
    meta: parts.slice(0, -1).some((p) => p.toLowerCase() === 'meta'),
    key,
  };
}

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const s = parseShortcut(shortcut);
  const eventKey = event.key.toLowerCase();
  return (
    event.ctrlKey === s.ctrl &&
    event.altKey === s.alt &&
    event.shiftKey === s.shift &&
    event.metaKey === s.meta &&
    eventKey === s.key
  );
}

// --- Helpers ---

/**
 * Shallow + nested merge of partial config into a full config.
 * Mirrors the StorageManager deepMerge behavior for in-memory use.
 */
function mergeConfig(base: UserConfig, partial: Partial<UserConfig>): UserConfig {
  const result = { ...base };

  const partialRecord = partial as Record<string, unknown>;
  const resultRecord = result as Record<string, unknown>;

  for (const key in partial) {
    if (partialRecord[key] === undefined) continue;

    const baseVal = resultRecord[key];
    const partialVal = partialRecord[key];

    if (
      partialVal &&
      typeof partialVal === 'object' &&
      !Array.isArray(partialVal) &&
      baseVal &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      resultRecord[key] = {
        ...(baseVal as Record<string, unknown>),
        ...(partialVal as Record<string, unknown>),
      };
    } else {
      resultRecord[key] = partialVal;
    }
  }

  return result;
}

// --- Bootstrap ---

bootstrap();
