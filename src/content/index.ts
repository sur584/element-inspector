/**
 * Element Inspector - Content Script Entry Point
 *
 * Orchestrates the inspector lifecycle:
 * - Listens for messages from the background/popup
 * - Reads and reacts to configuration changes
 * - Toggles the inspector and overlay on/off
 */

import type { UserConfig, Message } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/constants';
import { storage } from '../shared/storage';
import { initInspector, destroyInspector, updateInspectorConfig } from './inspector';
import { initOverlay, destroyOverlay } from './overlay';

// --- State ---
let currentConfig: UserConfig = structuredClone(DEFAULT_CONFIG);
let inspectorActive = false;
let globalKeyHandler: ((e: KeyboardEvent) => void) | null = null;
let toastTimer: number | null = null;

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
  // Read initial config
  currentConfig = await storage.getConfig();

  // If the inspector was previously enabled, re-activate
  if (currentConfig.enabled) {
    activateInspector();
  }

  // Listen for messages from background / popup
  chrome.runtime.onMessage.addListener(handleMessage);

  // Listen for storage changes (e.g. popup toggles or config edits)
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Global keyboard shortcuts (always active)
  installGlobalShortcuts();
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

    // Toggle inspector if enabled state changed
    if (currentConfig.enabled && !inspectorActive) {
      activateInspector();
    } else if (!currentConfig.enabled && inspectorActive) {
      deactivateInspector();
    } else if (inspectorActive) {
      // Config changed while active — push update
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

    // Escape: 切换检查器开关
    if (e.key === 'Escape') {
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
