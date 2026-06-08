# Element Inspector

浏览器扩展 — 鼠标悬停检查页面元素信息，支持多种格式复制，便于将元素上下文粘贴给 AI（Claude、ChatGPT 等）精准修改前端代码。

## 核心功能

- **悬停检测**：鼠标悬停即可查看元素的标签、选择器、样式、尺寸等完整信息
- **一键复制**：点击或快捷键复制元素信息，直接粘贴给 AI
- **4 种复制格式**：AI 友好格式 / JSON / HTML 片段 / CSS 选择器
- **冻结模式**：锁定当前元素信息，方便对比或截图
- **完全可定制**：快捷键、显示字段、主题外观均可自定义

## 快速开始

### 安装

```bash
pnpm install
pnpm build:chrome
```

### 加载到浏览器

**Chrome / Edge：**

1. 打开 `chrome://extensions/`（Edge 用 `edge://extensions/`）
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `.output/chrome-mv3/` 文件夹

**Firefox：**

```bash
pnpm build:firefox
```

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `.output/firefox/manifest.json`

## 使用方式

### 快捷键（可自定义）

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+E` | 开启/关闭检查器 |
| `C` | 复制当前悬停元素信息 |
| `X` | 冻结/解冻元素信息 |
| `Escape` | 关闭检查器 |

> Mac 用户将 `Ctrl` 替换为 `Command`

### 工作流程

1. 在任意页面按 `Ctrl+Shift+E` 启动检查器
2. 鼠标悬停在目标元素上，查看信息悬浮窗
3. 按 `C` 或点击「复制」按钮
4. 在 AI 对话框中 `Ctrl+V` 粘贴，附上修改需求

## 复制格式

| 格式 | 说明 |
|------|------|
| **AI 友好格式** | 结构化 Markdown，附带修改提示模板，适合直接粘贴给 AI |
| **JSON** | 完整结构化数据，适合程序处理 |
| **HTML 片段** | 可直接粘贴到 CodePen 等在线编辑器 |
| **CSS 选择器** | 选择器路径 + 样式规则，适合样式调试 |

## 项目结构

```
element-inspector/
├── entrypoints/              # WXT 入口
│   ├── background.ts         # 后台脚本
│   ├── content.ts            # 内容脚本
│   ├── popup.html            # 弹出面板
│   └── options.html          # 设置页面
├── src/
│   ├── content/              # 核心逻辑
│   │   ├── inspector.ts      # 悬停检测引擎
│   │   ├── overlay.ts        # Shadow DOM 悬浮窗 UI
│   │   ├── collector.ts      # 元素信息收集
│   │   └── copier.ts         # 剪贴板操作
│   ├── shared/               # 共享模块
│   │   ├── types.ts          # TypeScript 类型定义
│   │   ├── constants.ts      # 默认配置
│   │   ├── storage.ts        # Chrome Storage 管理
│   │   ├── messaging.ts      # 消息通信
│   │   └── formatters/       # 4 种格式化器
│   ├── popup/                # 弹出面板 (React)
│   ├── options/              # 设置页面 (React)
│   └── background/           # 后台脚本
├── wxt.config.ts             # WXT 框架配置
├── tsconfig.json
└── package.json
```

## 开发

```bash
# Chrome 开发模式（热重载）
pnpm dev:chrome

# Edge / Firefox
pnpm dev:edge
pnpm dev:firefox

# 类型检查
pnpm typecheck

# 构建
pnpm build:chrome
```

## 技术栈

- **WXT** — 跨浏览器扩展框架
- **React 18** — Popup / Options 页面 UI
- **TypeScript** — 类型安全
- **Shadow DOM** — 隔离扩展 UI，不污染宿主页面样式

## 浏览器兼容

- Chrome 88+
- Edge 88+
- Firefox 85+
- 其他 Chromium 内核浏览器（Brave、Vivaldi 等）

## License

MIT
