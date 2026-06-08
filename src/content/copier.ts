/**
 * Element Inspector - Clipboard Operations
 * Handles copying element info to clipboard with format support.
 */

import type { ElementInfo, CopyFormatId, UserConfig } from '../shared/types';
import { formatElementInfo } from '../shared/formatters';

/**
 * Copy text to the clipboard.
 *
 * Uses the modern Clipboard API when available, with a fallback to
 * the legacy `execCommand('copy')` approach.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (requires secure context)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy method
    }
  }

  // Legacy fallback: textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;

    // Make the textarea invisible but selectable
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.tabIndex = -1;

    document.body.append(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Format element info using the specified format and copy to clipboard.
 */
export async function copyElementInfo(
  info: ElementInfo,
  formatId: CopyFormatId,
  config: UserConfig,
): Promise<boolean> {
  const text = formatElementInfo(info, formatId, config);
  return copyToClipboard(text);
}
