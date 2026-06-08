/**
 * Element Inspector - Shadow DOM Overlay UI
 * Creates an isolated tooltip + highlight overlay for element inspection.
 */

import type { UserConfig, ElementInfo, CopyFormatId } from '../shared/types';
import { INFO_FIELDS, COPY_FORMATS } from '../shared/constants';

// --- DOM References ---
let rootHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let tooltipEl: HTMLDivElement | null = null;
let highlightEl: HTMLDivElement | null = null;
let toastEl: HTMLDivElement | null = null;
let toastTimer: number | null = null;
let statusBarTimer: number | null = null;
let outsideClickHandler: (() => void) | null = null;

// --- State ---
let currentInfo: ElementInfo | null = null;
let currentConfig: UserConfig | null = null;
let currentCopyCallback: ((formatId: CopyFormatId) => void) | null = null;
let dropdownOpen = false;
let tooltipEnterCallback: (() => void) | null = null;
let tooltipLeaveCallback: (() => void) | null = null;

// --- Embedded Styles ---
// Inline styles so no external CSS fetch is needed at runtime.
const STYLES = `
/* --- CSS Variables (Theme) --- */
:host {
  --ei-primary: #2196F3;
  --ei-primary-light: #e3f2fd;
  --ei-bg: #ffffff;
  --ei-bg-secondary: #f8f9fa;
  --ei-text: #212529;
  --ei-text-secondary: #6c757d;
  --ei-border: #dee2e6;
  --ei-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  --ei-radius: 8px;
  --ei-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --ei-font-mono: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, monospace;
  --ei-highlight-color: #2196F3;
  --ei-toast-bg: #323232;
  --ei-toast-text: #ffffff;
  --ei-max-width: 400px;
  --ei-z-index: 2147483647;
}

/* --- Tooltip Container --- */
.ei-tooltip {
  position: fixed;
  z-index: var(--ei-z-index);
  max-width: var(--ei-max-width);
  min-width: 240px;
  background: var(--ei-bg);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius);
  box-shadow: var(--ei-shadow);
  font-family: var(--ei-font);
  font-size: 12px;
  line-height: 1.5;
  color: var(--ei-text);
  pointer-events: auto;
  overflow: hidden;
  animation: ei-fadeIn 0.12s ease-out;
}

.ei-tooltip--hidden {
  display: none;
}

@keyframes ei-fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Header --- */
.ei-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--ei-bg-secondary);
  border-bottom: 1px solid var(--ei-border);
}

.ei-tag-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--ei-primary);
  font-family: var(--ei-font-mono);
}

.ei-selector-path {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--ei-text-secondary);
  font-family: var(--ei-font-mono);
}

/* --- Fields --- */
.ei-fields {
  padding: 6px 0;
  max-height: 260px;
  overflow-y: auto;
}

.ei-field {
  display: flex;
  align-items: flex-start;
  padding: 3px 12px;
  gap: 8px;
}

.ei-field:hover {
  background: var(--ei-bg-secondary);
}

.ei-field-key {
  flex-shrink: 0;
  min-width: 72px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ei-text-secondary);
  user-select: none;
}

.ei-field-value {
  flex: 1;
  font-size: 11px;
  color: var(--ei-text);
  word-break: break-all;
  font-family: var(--ei-font-mono);
  white-space: pre-wrap;
  max-height: 48px;
  overflow: hidden;
}

.ei-field-value--single-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: none;
}

/* --- Actions --- */
.ei-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid var(--ei-border);
  background: var(--ei-bg-secondary);
}

.ei-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 11px;
  font-family: var(--ei-font);
  font-weight: 500;
  border: 1px solid var(--ei-border);
  border-radius: 4px;
  background: var(--ei-bg);
  color: var(--ei-text);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.ei-btn:hover {
  background: var(--ei-primary-light);
  border-color: var(--ei-primary);
  color: var(--ei-primary);
}

.ei-btn:active {
  transform: scale(0.97);
}

.ei-btn--primary {
  background: var(--ei-primary);
  color: #fff;
  border-color: var(--ei-primary);
}

.ei-btn--primary:hover {
  background: #1976D2;
  border-color: #1976D2;
  color: #fff;
}

.ei-shortcut-hint {
  display: inline-block;
  padding: 0 4px;
  margin-left: 4px;
  background: rgba(255,255,255,0.25);
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* --- Status Bar (inline copied notification) --- */
.ei-status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  background: #4CAF50;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  animation: ei-statusIn 0.2s ease-out;
}

.ei-status-bar--hidden {
  display: none;
}

.ei-status-icon {
  font-size: 14px;
  font-weight: 700;
}

@keyframes ei-statusIn {
  from { opacity: 0; max-height: 0; padding: 0 12px; }
  to { opacity: 1; max-height: 40px; padding: 6px 12px; }
}

/* --- Freeze Badge --- */
.ei-freeze-badge {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  background: #9C27B0;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  animation: ei-statusIn 0.2s ease-out;
}

/* --- Format Selector --- */
.ei-format-selector {
  position: relative;
  margin-left: auto;
}

.ei-format-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: var(--ei-font);
  border: 1px solid var(--ei-border);
  border-radius: 4px;
  background: var(--ei-bg);
  color: var(--ei-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.ei-format-trigger:hover {
  border-color: var(--ei-primary);
  color: var(--ei-primary);
}

.ei-format-trigger::after {
  content: "";
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  margin-left: 2px;
}

.ei-format-dropdown {
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  min-width: 180px;
  background: var(--ei-bg);
  border: 1px solid var(--ei-border);
  border-radius: var(--ei-radius);
  box-shadow: var(--ei-shadow);
  padding: 4px 0;
  z-index: 1;
  animation: ei-fadeIn 0.12s ease-out;
}

.ei-format-dropdown--hidden {
  display: none;
}

.ei-format-option {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.1s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: var(--ei-font);
}

.ei-format-option:hover {
  background: var(--ei-primary-light);
}

.ei-format-option--active {
  background: var(--ei-primary-light);
}

.ei-format-option-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ei-text);
}

.ei-format-option-desc {
  font-size: 10px;
  color: var(--ei-text-secondary);
}

/* --- Highlight Overlay --- */
.ei-highlight {
  position: fixed;
  z-index: calc(var(--ei-z-index) - 1);
  pointer-events: none;
  border: 2px solid var(--ei-highlight-color);
  border-radius: 2px;
  background: rgba(33, 150, 243, 0.06);
  transition: all 0.08s ease-out;
}

.ei-highlight--hidden {
  display: none;
}

/* --- Toast Notification --- */
.ei-toast {
  position: fixed;
  z-index: var(--ei-z-index);
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: var(--ei-toast-bg);
  color: var(--ei-toast-text);
  font-family: var(--ei-font);
  font-size: 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  animation: ei-toastIn 0.2s ease-out;
  white-space: nowrap;
}

.ei-toast--hidden {
  display: none;
}

.ei-toast--exit {
  animation: ei-toastOut 0.2s ease-in forwards;
}

@keyframes ei-toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes ei-toastOut {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(8px); }
}
`;

// --- Field label lookup ---
const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  INFO_FIELDS.map((f) => [f.id, f.label]),
);

// --- Format label lookup ---
const FORMAT_LABELS: Record<string, string> = Object.fromEntries(
  COPY_FORMATS.map((f) => [f.id, f.label]),
);

const FORMAT_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  COPY_FORMATS.map((f) => [f.id, f.description]),
);

// --- DOM Helpers ---

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// --- Build Tooltip DOM ---

function buildTooltip(): HTMLDivElement {
  const tooltip = el('div', 'ei-tooltip ei-tooltip--hidden');

  // Header
  const header = el('div', 'ei-header');
  const tagName = el('span', 'ei-tag-name');
  const selectorPath = el('span', 'ei-selector-path');
  header.append(tagName, selectorPath);

  // Fields container
  const fields = el('div', 'ei-fields');

  // Actions
  const actions = el('div', 'ei-actions');
  const copyBtn = el('button', 'ei-btn ei-btn--primary');
  copyBtn.type = 'button';
  copyBtn.innerHTML = '复制';

  const formatSelector = el('div', 'ei-format-selector');
  const formatTrigger = el('button', 'ei-format-trigger', '格式');
  formatTrigger.type = 'button';

  const dropdown = el('div', 'ei-format-dropdown ei-format-dropdown--hidden');
  formatSelector.append(formatTrigger, dropdown);

  actions.append(copyBtn, formatSelector);

  // 复制成功状态栏（初始隐藏）
  const statusBar = el('div', 'ei-status-bar ei-status-bar--hidden');
  statusBar.innerHTML = '<span class="ei-status-icon">&#10003;</span> 已复制到剪贴板';

  tooltip.append(header, fields, actions, statusBar);
  return tooltip;
}

// --- Render Tooltip Content ---

function renderTooltip(info: ElementInfo, config: UserConfig): void {
  if (!tooltipEl) return;

  // Update header
  const tagNameEl = tooltipEl.querySelector('.ei-tag-name');
  if (tagNameEl) tagNameEl.textContent = `<${info.tagName}>`;

  const selectorEl = tooltipEl.querySelector('.ei-selector-path');
  if (selectorEl) selectorEl.textContent = info.selector;

  // Update fields
  const fieldsContainer = tooltipEl.querySelector('.ei-fields');
  if (fieldsContainer) {
    fieldsContainer.innerHTML = '';

    const visibleFields = config.visibleFields;

    // Iterate over INFO_FIELDS order for consistent display
    for (const field of INFO_FIELDS) {
      if (!visibleFields[field.id]) continue;

      const value = info[field.id as keyof ElementInfo];
      if (value === null || value === undefined) continue;

      const fieldRow = el('div', 'ei-field');
      const keyEl = el('span', 'ei-field-key', field.label);
      const valueEl = el('span', 'ei-field-value');

      // Format the value for display
      const displayValue = formatFieldValue(field.id, value);
      valueEl.textContent = displayValue;

      // Single-line for short values
      if (typeof displayValue === 'string' && !displayValue.includes('\n')) {
        valueEl.classList.add('ei-field-value--single-line');
      }

      fieldRow.append(keyEl, valueEl);
      fieldsContainer.append(fieldRow);
    }
  }

  // Update format dropdown
  const dropdown = tooltipEl.querySelector('.ei-format-dropdown');
  if (dropdown) {
    dropdown.innerHTML = '';
    for (const fmt of COPY_FORMATS) {
      if (!config.activeFormats.includes(fmt.id)) continue;

      const option = el('button', 'ei-format-option');
      if (fmt.id === config.defaultFormat) {
        option.classList.add('ei-format-option--active');
      }
      option.type = 'button';

      const label = el('span', 'ei-format-option-label', fmt.label);
      const desc = el('span', 'ei-format-option-desc', fmt.description);
      option.append(label, desc);

      option.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentCopyCallback) {
          currentCopyCallback(fmt.id);
        }
        closeDropdown();
      });

      dropdown.append(option);
    }
  }

  // Update format trigger text
  const formatTrigger = tooltipEl.querySelector('.ei-format-trigger');
  if (formatTrigger) {
    const defaultLabel =
      FORMAT_LABELS[config.defaultFormat] ?? config.defaultFormat;
    formatTrigger.textContent = defaultLabel;
    // Re-add the arrow pseudo-element via CSS (handled by ::after)
  }

  // Copy button click
  const copyBtn = tooltipEl.querySelector('.ei-btn--primary');
  if (copyBtn) {
    // Clone to remove old listeners
    const newCopyBtn = copyBtn.cloneNode(true) as HTMLButtonElement;
    newCopyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCopyCallback) {
        currentCopyCallback(config.defaultFormat);
      }
    });
    copyBtn.parentNode?.replaceChild(newCopyBtn, copyBtn);
  }

  // Format trigger click to toggle dropdown
  const newFormatTrigger = tooltipEl.querySelector('.ei-format-trigger');
  if (newFormatTrigger) {
    const clone = newFormatTrigger.cloneNode(true) as HTMLButtonElement;
    clone.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
    newFormatTrigger.parentNode?.replaceChild(clone, newFormatTrigger);
  }
}

/**
 * Format a field value for tooltip display.
 */
function formatFieldValue(
  fieldId: string,
  value: unknown,
): string {
  if (value === null || value === undefined) return '';

  switch (fieldId) {
    case 'classList':
      return Array.isArray(value) ? (value as string[]).join(', ') : String(value);

    case 'computedStyles': {
      const obj = value as Record<string, string>;
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }

    case 'boundingBox': {
      const box = value as DOMRect | null;
      if (!box) return '';
      return `${Math.round(box.width)} x ${Math.round(box.height)} (x: ${Math.round(box.x)}, y: ${Math.round(box.y)})`;
    }

    case 'attributes':
    case 'dataAttributes': {
      const obj = value as Record<string, string>;
      return Object.entries(obj)
        .map(([k, v]) => `${k}="${v}"`)
        .join('\n');
    }

    case 'children': {
      const arr = value as { tagName: string; className: string }[];
      return arr
        .map((c) => `<${c.tagName}${c.className ? ` class="${c.className}"` : ''}>`)
        .join(', ');
    }

    case 'parent': {
      const p = value as { tagName: string; className: string; id: string | null } | null;
      if (!p) return '';
      let s = `<${p.tagName}`;
      if (p.className) s += ` class="${p.className}"`;
      if (p.id) s += ` id="${p.id}"`;
      s += '>';
      return s;
    }

    case 'pseudoElements': {
      const obj = value as Record<string, string>;
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }

    default:
      return String(value);
  }
}

// --- Dropdown ---

function toggleDropdown(): void {
  const dropdown = tooltipEl?.querySelector('.ei-format-dropdown');
  if (!dropdown) return;
  dropdownOpen = !dropdownOpen;
  dropdown.classList.toggle('ei-format-dropdown--hidden', !dropdownOpen);
}

function closeDropdown(): void {
  const dropdown = tooltipEl?.querySelector('.ei-format-dropdown');
  if (!dropdown) return;
  dropdownOpen = false;
  dropdown.classList.add('ei-format-dropdown--hidden');
}

// --- Positioning ---

function positionTooltip(event: MouseEvent): void {
  if (!tooltipEl) return;

  const padding = 12;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  // Temporarily show to measure
  tooltipEl.style.left = '0px';
  tooltipEl.style.top = '0px';
  tooltipEl.style.visibility = 'hidden';
  tooltipEl.classList.remove('ei-tooltip--hidden');

  const rect = tooltipEl.getBoundingClientRect();
  const tooltipW = rect.width;
  const tooltipH = rect.height;

  let x = event.clientX + padding;
  let y = event.clientY + padding;

  // Flip horizontally if overflowing right
  if (x + tooltipW > viewportW - padding) {
    x = event.clientX - tooltipW - padding;
  }

  // Flip vertically if overflowing bottom
  if (y + tooltipH > viewportH - padding) {
    y = event.clientY - tooltipH - padding;
  }

  // Clamp to viewport
  x = Math.max(padding, Math.min(x, viewportW - tooltipW - padding));
  y = Math.max(padding, Math.min(y, viewportH - tooltipH - padding));

  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.style.visibility = '';
}

// --- Highlight ---

function showHighlight(info: ElementInfo, config: UserConfig): void {
  if (!highlightEl || !config.overlay.showHighlight) return;

  const box = info.boundingBox;
  if (!box) {
    highlightEl.classList.add('ei-highlight--hidden');
    return;
  }

  highlightEl.classList.remove('ei-highlight--hidden');
  highlightEl.style.left = `${box.left}px`;
  highlightEl.style.top = `${box.top}px`;
  highlightEl.style.width = `${box.width}px`;
  highlightEl.style.height = `${box.height}px`;
  highlightEl.style.borderColor = config.overlay.highlightColor;
}

function hideHighlight(): void {
  if (highlightEl) {
    highlightEl.classList.add('ei-highlight--hidden');
  }
}

// --- Public API ---

/**
 * Initialize the overlay: create Shadow DOM host and children.
 */
export function initOverlay(): void {
  if (rootHost) return; // already initialized

  // Create host element
  rootHost = document.createElement('element-inspector-root');
  rootHost.style.all = 'initial';
  rootHost.style.position = 'fixed';
  rootHost.style.top = '0';
  rootHost.style.left = '0';
  rootHost.style.width = '0';
  rootHost.style.height = '0';
  rootHost.style.overflow = 'visible';
  rootHost.style.pointerEvents = 'none';
  rootHost.style.zIndex = '2147483647';

  // Attach Shadow DOM
  shadowRoot = rootHost.attachShadow({ mode: 'closed' });

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = STYLES;
  shadowRoot.append(styleEl);

  // Build highlight overlay
  highlightEl = el('div', 'ei-highlight ei-highlight--hidden');
  shadowRoot.append(highlightEl);

  // Build tooltip
  tooltipEl = buildTooltip();
  shadowRoot.append(tooltipEl);

  // 鼠标进入/离开工具提示时的回调
  tooltipEl.addEventListener('mouseenter', () => {
    tooltipEnterCallback?.();
  });
  tooltipEl.addEventListener('mouseleave', () => {
    tooltipLeaveCallback?.();
  });

  // Build toast
  toastEl = el('div', 'ei-toast ei-toast--hidden');
  shadowRoot.append(toastEl);

  // Append to body
  document.body.append(rootHost);

  // Close dropdown on outside click
  outsideClickHandler = () => closeDropdown();
  document.addEventListener('click', outsideClickHandler, { capture: true });
}

/**
 * Destroy the overlay and clean up all DOM elements.
 */
export function destroyOverlay(): void {
  if (toastTimer !== null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  if (statusBarTimer !== null) {
    clearTimeout(statusBarTimer);
    statusBarTimer = null;
  }

  // Remove outside click listener
  if (outsideClickHandler) {
    document.removeEventListener('click', outsideClickHandler, { capture: true });
    outsideClickHandler = null;
  }

  if (rootHost) {
    rootHost.remove();
    rootHost = null;
    shadowRoot = null;
    tooltipEl = null;
    highlightEl = null;
    toastEl = null;
  }

  currentInfo = null;
  currentConfig = null;
  currentCopyCallback = null;
  dropdownOpen = false;
}

/**
 * Show the tooltip and highlight for an element.
 */
export function show(
  info: ElementInfo,
  event: MouseEvent,
  config: UserConfig,
  onCopy: (formatId: CopyFormatId) => void,
): void {
  if (!tooltipEl || !highlightEl) return;

  currentInfo = info;
  currentConfig = config;
  currentCopyCallback = onCopy;

  // Apply max-width from config
  tooltipEl.style.setProperty('--ei-max-width', `${config.overlay.maxWidth}px`);

  renderTooltip(info, config);
  positionTooltip(event);
  showHighlight(info, config);

  tooltipEl.classList.remove('ei-tooltip--hidden');
}

/**
 * Hide the tooltip and highlight.
 */
export function hide(): void {
  if (tooltipEl) {
    tooltipEl.classList.add('ei-tooltip--hidden');
  }
  hideHighlight();
  closeDropdown();
}

/**
 * Show a brief toast notification.
 */
export function showToast(message: string, duration = 1500): void {
  if (!toastEl) return;

  if (toastTimer !== null) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  toastEl.textContent = message;
  toastEl.classList.remove('ei-toast--hidden', 'ei-toast--exit');

  toastTimer = window.setTimeout(() => {
    toastEl?.classList.add('ei-toast--exit');
    toastTimer = window.setTimeout(() => {
      toastEl?.classList.add('ei-toast--hidden');
      toastEl?.classList.remove('ei-toast--exit');
      toastTimer = null;
    }, 200);
  }, duration);
}

/**
 * Show copied status inside the tooltip.
 */
export function showCopiedStatus(duration = 1200): void {
  if (!tooltipEl) return;

  const statusBar = tooltipEl.querySelector('.ei-status-bar');
  if (!statusBar) return;

  if (statusBarTimer !== null) {
    clearTimeout(statusBarTimer);
    statusBarTimer = null;
  }

  statusBar.classList.remove('ei-status-bar--hidden');

  statusBarTimer = window.setTimeout(() => {
    statusBar.classList.add('ei-status-bar--hidden');
    statusBarTimer = null;
  }, duration);
}

/**
 * Register callbacks for tooltip mouse enter/leave events.
 * Used by inspector to manage hide timeout when user hovers over tooltip.
 */
export function onTooltipInteraction(
  onEnter: () => void,
  onLeave: () => void,
): void {
  tooltipEnterCallback = onEnter;
  tooltipLeaveCallback = onLeave;
}

/**
 * Show freeze badge (冻结模式提示).
 */
export function showFreezeBadge(): void {
  if (!tooltipEl) return;
  let badge = tooltipEl.querySelector('.ei-freeze-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'ei-freeze-badge';
    badge.textContent = '❄ 已冻结';
    const header = tooltipEl.querySelector('.ei-header');
    header?.after(badge);
  }
  (badge as HTMLElement).style.display = 'flex';
}

/**
 * Hide freeze badge.
 */
export function hideFreezeBadge(): void {
  if (!tooltipEl) return;
  const badge = tooltipEl.querySelector('.ei-freeze-badge');
  if (badge) {
    (badge as HTMLElement).style.display = 'none';
  }
}


