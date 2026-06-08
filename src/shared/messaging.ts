import type { Message } from './types';

export async function sendMessage<T>(
  message: Message<T>,
  tabId?: number
): Promise<unknown> {
  try {
    if (tabId) {
      return await chrome.tabs.sendMessage(tabId, message);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      return await chrome.tabs.sendMessage(tab.id, message);
    }
  } catch {
    // Tab may have been closed or background worker not running
  }

  return null;
}

export function onMessage<T>(
  handler: (message: Message<T>, sender: chrome.runtime.MessageSender) => void
): void {
  chrome.runtime.onMessage.addListener(
    (message: Message<T>, sender, sendResponse) => {
      handler(message, sender);
      return false;
    }
  );
}

export async function sendToBackground<T>(
  message: Message<T>
): Promise<unknown> {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    // Background worker may not be running
    return null;
  }
}

// Alias for backward compatibility
export const onBackgroundMessage = onMessage;
