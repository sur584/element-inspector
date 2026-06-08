// 所有信息字段类型
export type InfoField =
  | 'tagName'
  | 'id'
  | 'className'
  | 'classList'
  | 'textContent'
  | 'innerHTML'
  | 'outerHTML'
  | 'computedStyles'
  | 'inlineStyles'
  | 'boundingBox'
  | 'attributes'
  | 'children'
  | 'parent'
  | 'selector'
  | 'pseudoElements'
  | 'dataAttributes';

// 哪些字段在悬停覆盖层中可见
export type VisibleFields = Record<InfoField, boolean>;

// 复制格式标识符
export type CopyFormatId = 'ai-friendly' | 'json' | 'html-snippet' | 'css-selector';

// 快捷键配置
export interface ShortcutConfig {
  toggle: string;      // 切换检查器，默认 Ctrl+Shift+I
  copy: string;        // 复制元素，默认 C
  close: string;       // 关闭检查器，默认 Escape
  freeze: string;      // 冻结元素信息，默认 X
}

// 用户配置（持久化到storage）
export interface UserConfig {
  enabled: boolean;
  visibleFields: VisibleFields;
  activeFormats: CopyFormatId[];
  defaultFormat: CopyFormatId;
  overlay: {
    position: 'cursor' | 'element-top' | 'bottom-bar';
    theme: 'light' | 'dark' | 'auto';
    maxWidth: number;
    showCopyButton: boolean;
    showHighlight: boolean;
    highlightColor: string;
  };
  shortcuts: ShortcutConfig;
  advanced: {
    excludeSelectors: string[];
    includeShadowDom: boolean;
    throttleMs: number;
    maxTextLength: number;
  };
}

// 为单个元素收集的信息
export interface ElementInfo {
  tagName: string;
  id: string | null;
  className: string | null;
  classList: string[];
  textContent: string | null;
  innerHTML: string | null;
  outerHTML: string;
  computedStyles: Record<string, string>;
  inlineStyles: string | null;
  boundingBox: DOMRect | null;
  attributes: Record<string, string>;
  children: { tagName: string; className: string }[];
  parent: { tagName: string; className: string; id: string | null } | null;
  selector: string;
  pseudoElements: Record<string, string>;
  dataAttributes: Record<string, string>;
}

// 格式化器接口
export interface Formatter {
  id: CopyFormatId;
  label: string;
  description: string;
  format(info: ElementInfo, config: UserConfig): string;
}

// 消息类型
export type MessageType =
  | 'TOGGLE_INSPECTOR'
  | 'UPDATE_CONFIG'
  | 'COPY_ELEMENT'
  | 'ELEMENT_HOVERED'
  | 'GET_STATE'
  | 'STATE_RESPONSE';

// 消息接口
export interface Message<T = unknown> {
  type: MessageType;
  payload?: T;
}
