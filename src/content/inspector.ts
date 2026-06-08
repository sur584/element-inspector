/**
 * Element Inspector - Hover Detection Engine
 * Listens for mouseover/mouseout events on the document and triggers
 * element info collection and overlay display.
 */

import type { UserConfig, ElementInfo } from '../shared/types';
import { DEFAULT_CONFIG } from '../shared/constants';
import { getElementInfo } from './collector';
import * as overlay from './overlay';
import { copyElementInfo } from './copier';

// --- State ---
let config: UserConfig = structuredClone(DEFAULT_CONFIG);
let enabled = false;
let currentTarget: Element | null = null;
let hoverRafId: number | null = null;
let hideTimeoutId: number | null = null;
let lastMouseEvent: MouseEvent | null = null;
let mouseOverTooltip = false;
let frozen = false; // 冻结模式

// --- Event Handlers ---

/**
 * Check whether an element should be excluded from inspection.
 */
function shouldExclude(el: Element): boolean {
  // Exclude elements inside the extension's own Shadow DOM
  if (el.closest('element-inspector-root')) return true;

  // Exclude by tag name / selector from config
  for (const sel of config.advanced.excludeSelectors) {
    try {
      if (el.matches(sel) || el.closest(sel)) return true;
    } catch {
      // Invalid selector, skip
    }
  }

  return false;
}

/**
 * Process a hover event via requestAnimationFrame for throttling.
 */
function scheduleHover(event: MouseEvent): void {
  lastMouseEvent = event;

  // 冻结模式下不更新
  if (frozen) return;

  if (hoverRafId !== null) return;

  hoverRafId = requestAnimationFrame(() => {
    hoverRafId = null;
    // Use lastMouseEvent to ensure we process the latest event
    handleHover(lastMouseEvent!);
  });
}

/**
 * Core hover handler: collect info and show overlay.
 */
function handleHover(event: MouseEvent): void {
  const target = event.target as Element | null;
  if (!target || target === currentTarget) return;

  // Cancel any pending hide
  if (hideTimeoutId !== null) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }

  currentTarget = target;

  if (shouldExclude(target)) {
    overlay.hide();
    return;
  }

  const info: ElementInfo = getElementInfo(target, config);
  overlay.show(info, event, config, handleCopy);
}

/**
 * Handle mouseout: delay-hide to prevent flicker.
 */
function handleMouseOut(event: MouseEvent): void {
  // 冻结模式下不隐藏
  if (frozen) return;

  const related = event.relatedTarget as Element | null;

  // If moving to overlay (Shadow DOM host), keep showing
  if (related && related.closest('element-inspector-root')) return;

  // If mouse is over tooltip, don't hide
  if (mouseOverTooltip) return;

  scheduleHide();
}

/**
 * Schedule hiding the overlay after a delay.
 */
function scheduleHide(): void {
  if (hideTimeoutId !== null) {
    clearTimeout(hideTimeoutId);
  }

  hideTimeoutId = window.setTimeout(() => {
    hideTimeoutId = null;
    if (!mouseOverTooltip) {
      currentTarget = null;
      overlay.hide();
    }
  }, 200);
}

/**
 * Called when mouse enters the tooltip overlay.
 */
function handleTooltipEnter(): void {
  mouseOverTooltip = true;
  if (hideTimeoutId !== null) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }
}

/**
 * Called when mouse leaves the tooltip overlay.
 */
function handleTooltipLeave(): void {
  mouseOverTooltip = false;
  scheduleHide();
}

/**
 * Handle click: copy element info to clipboard.
 */
function handleClick(event: MouseEvent): void {
  if (!enabled) return;

  const target = event.target as Element | null;
  if (!target) return;

  // Ignore clicks on the overlay itself
  if (target.closest('element-inspector-root')) return;

  if (shouldExclude(target)) return;

  // Only stop propagation, not preventDefault — allow normal page interactions
  event.stopPropagation();

  // 直接使用点击目标，不依赖 currentTarget
  const info = getElementInfo(target, config);
  copyElementInfo(info, config.defaultFormat as import('../shared/types').CopyFormatId, config).then(
    (ok) => {
      if (ok) {
        overlay.showCopiedStatus();
      }
    },
  );
}

/**
 * Copy callback invoked by the overlay.
 */
function handleCopy(formatId: string): void {
  if (!currentTarget || !lastMouseEvent) return;
  const info = getElementInfo(currentTarget, config);
  copyElementInfo(info, formatId as import('../shared/types').CopyFormatId, config).then(
    (ok) => {
      if (ok) {
        overlay.showCopiedStatus();
      }
    },
  );
}

// --- Keyboard shortcuts ---

let lastCopyTime = 0;

/**
 * Parse a shortcut string like 'Ctrl+Shift+I' or 'C' into { modifiers, key }.
 */
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

/**
 * Check if a keyboard event matches a configured shortcut string.
 */
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

function handleKeyDown(event: KeyboardEvent): void {
  if (!enabled) return;

  // 关闭检查器
  if (matchesShortcut(event, config.shortcuts.close)) {
    const target = event.target as Element;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
      return;
    }
    event.preventDefault();
    destroyInspector();
    return;
  }

  // 冻结/解冻当前元素信息
  if (matchesShortcut(event, config.shortcuts.freeze)) {
    // 忽略在输入框中的按键
    const target = event.target as Element;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    frozen = !frozen;
    if (frozen) {
      // 冻结时取消待定的隐藏定时器，防止 tooltip 消失
      if (hideTimeoutId !== null) {
        clearTimeout(hideTimeoutId);
        hideTimeoutId = null;
      }
      overlay.showFreezeBadge();
    } else {
      // 解冻时重置 currentTarget，确保下次悬停能触发新的显示
      currentTarget = null;
      overlay.hideFreezeBadge();
    }
    return;
  }

  // 复制当前悬停元素信息
  if (matchesShortcut(event, config.shortcuts.copy)) {
    // 忽略在输入框中的按键
    const target = event.target as Element;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as HTMLElement).isContentEditable)) {
      return;
    }

    // 防止按住按键时重复触发（300ms内不重复）
    const now = Date.now();
    if (now - lastCopyTime < 300) return;

    if (currentTarget) {
      event.preventDefault();
      event.stopPropagation();
      lastCopyTime = now;
      handleCopy(config.defaultFormat);
    }
  }
}

// --- Throttle config ---

/**
 * Attach event listeners with the configured throttle.
 */
function attachListeners(): void {
  document.addEventListener('mouseover', scheduleHover, { capture: true });
  document.addEventListener('mouseout', handleMouseOut, { capture: true });
  document.addEventListener('click', handleClick, { capture: true });
  document.addEventListener('keydown', handleKeyDown, { capture: true });
}

function detachListeners(): void {
  document.removeEventListener('mouseover', scheduleHover, { capture: true });
  document.removeEventListener('mouseout', handleMouseOut, { capture: true });
  document.removeEventListener('click', handleClick, { capture: true });
  document.removeEventListener('keydown', handleKeyDown, { capture: true });
}

// --- Public API ---

/**
 * Initialize the inspector with user configuration.
 * Call this when the inspector is toggled ON.
 */
export function initInspector(userConfig: UserConfig): void {
  if (enabled) return;

  config = userConfig;
  enabled = true;
  mouseOverTooltip = false;

  overlay.initOverlay();
  overlay.onTooltipInteraction(handleTooltipEnter, handleTooltipLeave);
  attachListeners();
}

/**
 * Destroy the inspector and clean up all resources.
 * Call this when the inspector is toggled OFF.
 */
export function destroyInspector(): void {
  if (!enabled) return;

  enabled = false;
  currentTarget = null;
  mouseOverTooltip = false;
  frozen = false;

  if (hoverRafId !== null) {
    cancelAnimationFrame(hoverRafId);
    hoverRafId = null;
  }

  if (hideTimeoutId !== null) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = null;
  }

  detachListeners();
  overlay.destroyOverlay();
}

/**
 * Update configuration while the inspector is running.
 */
export function updateInspectorConfig(newConfig: UserConfig): void {
  config = newConfig;
}
