import { storage } from '../shared/storage';
import { onBackgroundMessage } from '../shared/messaging';
import type { Message } from '../shared/types';

// ---------------------------------------------------------------------------
// 扩展安装 / 更新时初始化默认配置
// ---------------------------------------------------------------------------
chrome.runtime.onInstalled.addListener(async () => {
  await storage.getConfig(); // 会写入 DEFAULT_CONFIG（如果尚不存在）
  console.log('Element Inspector - AI Helper installed');
});

// ---------------------------------------------------------------------------
// 监听键盘命令 (Ctrl+Shift+I / Cmd+Shift+I)，切换检查器开关
// ---------------------------------------------------------------------------
chrome.commands?.onCommand.addListener(async (command: string) => {
  if (command === 'toggle-inspector') {
    const config = await storage.getConfig();
    const newEnabled = !config.enabled;
    await storage.updateConfig({ enabled: newEnabled });

    // 通知当前活动标签页的 content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const msg: Message<{ enabled: boolean }> = {
        type: 'TOGGLE_INSPECTOR',
        payload: { enabled: newEnabled },
      };
      chrome.tabs.sendMessage(tab.id, msg).catch(() => {
        // content script 可能尚未注入，忽略错误
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 处理来自 popup / content script 的消息
// ---------------------------------------------------------------------------
onBackgroundMessage(async (message: Message, sender: chrome.runtime.MessageSender) => {
  switch (message.type) {
    case 'GET_STATE': {
      // 回复发送者的当前状态（per-tab）
      if (sender.tab?.id) {
        const response: Message<{ enabled: boolean }> = {
          type: 'STATE_RESPONSE',
          payload: { enabled: false }, // 每个标签页独立管理状态
        };
        chrome.tabs.sendMessage(sender.tab.id, response).catch(() => {});
      }
      break;
    }

    case 'TOGGLE_INSPECTOR': {
      // 直接转发给发送者的标签页（per-tab toggle）
      const payload = message.payload as { enabled?: boolean } | undefined;
      if (sender.tab?.id && payload) {
        const msg: Message<{ enabled: boolean }> = {
          type: 'TOGGLE_INSPECTOR',
          payload: { enabled: payload.enabled ?? false },
        };
        chrome.tabs.sendMessage(sender.tab.id, msg).catch(() => {});
      }
      break;
    }

    case 'UPDATE_CONFIG': {
      // 允许 popup / options 直接推送配置片段
      const partial = message.payload as Record<string, unknown> | undefined;
      if (partial) {
        await storage.updateConfig(partial as any);
      }
      break;
    }

    default:
      break;
  }
});
