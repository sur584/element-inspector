import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Element Inspector - AI Helper',
    description: '鼠标悬停检查页面元素信息，支持多种格式复制，便于AI辅助前端开发',
    version: '1.1.0',
    permissions: ['storage', 'activeTab', 'clipboardWrite'],
    host_permissions: ['<all_urls>'],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        '16': 'icons/icon-16.png',
        '32': 'icons/icon-32.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    },
    options_page: 'options.html',
    icons: {
      '16': 'icons/icon-16.png',
      '32': 'icons/icon-32.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    commands: {
      'toggle-inspector': {
        suggested_key: {
          default: 'Ctrl+Shift+E',
          mac: 'Command+Shift+E',
        },
        description: '切换元素检查器',
      },
    },
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
