import type { UserConfig, InfoField, CopyFormatId } from './types';

// 信息字段定义
export const INFO_FIELDS: { id: InfoField; label: string; category: string }[] = [
  // 基础信息
  { id: 'tagName', label: '标签名', category: 'basic' },
  { id: 'id', label: 'ID', category: 'basic' },
  { id: 'className', label: '类名', category: 'basic' },
  { id: 'classList', label: '类列表', category: 'basic' },
  // 内容信息
  { id: 'textContent', label: '文本内容', category: 'content' },
  { id: 'innerHTML', label: '内部HTML', category: 'content' },
  { id: 'outerHTML', label: '外部HTML', category: 'content' },
  // 样式信息
  { id: 'computedStyles', label: '计算样式', category: 'styles' },
  { id: 'inlineStyles', label: '内联样式', category: 'styles' },
  { id: 'pseudoElements', label: '伪元素', category: 'styles' },
  // 结构信息
  { id: 'attributes', label: '属性', category: 'structure' },
  { id: 'dataAttributes', label: '数据属性', category: 'structure' },
  { id: 'children', label: '子元素', category: 'structure' },
  { id: 'parent', label: '父元素', category: 'structure' },
  { id: 'selector', label: 'CSS选择器', category: 'structure' },
  // 布局信息
  { id: 'boundingBox', label: '尺寸位置', category: 'layout' },
];

// 默认信息字段配置
export const DEFAULT_VISIBLE_FIELDS: Record<InfoField, boolean> = {
  tagName: true,
  id: true,
  className: true,
  classList: true,
  textContent: true,
  innerHTML: false,
  outerHTML: false,
  computedStyles: true,
  inlineStyles: true,
  pseudoElements: false,
  attributes: true,
  dataAttributes: true,
  children: true,
  parent: true,
  selector: true,
  boundingBox: true,
};

// 复制格式定义
export const COPY_FORMATS: { id: CopyFormatId; label: string; description: string }[] = [
  {
    id: 'ai-friendly',
    label: 'AI友好格式',
    description: '结构化文本，方便直接粘贴给AI进行修改',
  },
  {
    id: 'json',
    label: 'JSON格式',
    description: 'JSON格式，包含所有信息的结构化数据',
  },
  {
    id: 'html-snippet',
    label: 'HTML片段',
    description: 'HTML代码片段，适合粘贴到CodePen等工具',
  },
  {
    id: 'css-selector',
    label: 'CSS选择器',
    description: 'CSS选择器路径和相关样式规则',
  },
];

// 默认用户配置
export const DEFAULT_CONFIG: UserConfig = {
  enabled: false,
  visibleFields: DEFAULT_VISIBLE_FIELDS,
  activeFormats: ['ai-friendly', 'json', 'html-snippet', 'css-selector'],
  defaultFormat: 'ai-friendly',
  overlay: {
    position: 'cursor',
    theme: 'auto',
    maxWidth: 400,
    showCopyButton: true,
    showHighlight: true,
    highlightColor: '#2196F3',
  },
  shortcuts: {
    toggle: 'Ctrl+Shift+E',
    copy: 'C',
    close: 'Escape',
    freeze: 'X',
  },
  advanced: {
    excludeSelectors: [
      'script',
      'style',
      'noscript',
      'link',
      'meta',
      'title',
      'head',
      'element-inspector-root',
    ],
    includeShadowDom: false,
    throttleMs: 50,
    maxTextLength: 200,
  },
  devtools: {
    enabled: true,
    console: {
      enabled: true,
      maxEntries: 500,
      captureLevels: ['log', 'info', 'warn', 'error', 'debug'],
    },
    network: {
      enabled: true,
      maxEntries: 200,
      captureBody: true,
      filterUrls: [],
    },
    errors: {
      enabled: true,
      maxEntries: 100,
    },
    domSnapshot: {
      includeStyles: false,
      maxDepth: 10,
    },
  },
};
