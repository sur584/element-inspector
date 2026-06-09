// DevTools 功能类型定义

// 控制台日志条目
export interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: string[];
  stackTrace?: string;
}

// 网络请求条目
export interface NetworkEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  type: 'fetch' | 'xhr';
  size: number;
}

// JavaScript 错误条目
export interface ErrorEntry {
  id: string;
  timestamp: number;
  message: string;
  source: string;
  lineno: number;
  colno: number;
  stackTrace?: string;
  type: 'error' | 'unhandledrejection';
}

// DOM 快照
export interface DomSnapshot {
  html: string;
  timestamp: number;
  url: string;
  title: string;
}

// DevTools 配置
export interface DevToolsConfig {
  enabled: boolean;
  console: {
    enabled: boolean;
    maxEntries: number;
    captureLevels: ('log' | 'info' | 'warn' | 'error' | 'debug')[];
  };
  network: {
    enabled: boolean;
    maxEntries: number;
    captureBody: boolean;
    filterUrls: string[];
  };
  errors: {
    enabled: boolean;
    maxEntries: number;
  };
  domSnapshot: {
    includeStyles: boolean;
    maxDepth: number;
  };
}

// 快照选项
export interface SnapshotOptions {
  includeStyles?: boolean;
  maxDepth?: number;
  excludeSelectors?: string[];
}

// 过滤选项
export interface FilterOptions {
  text?: string;
  level?: ConsoleEntry['level'];
  method?: string;
  statusCode?: number;
  url?: string;
}

// 页面注入脚本消息
export interface InjectedMessage {
  type: 'console' | 'network' | 'error' | 'unhandledrejection';
  data: ConsoleEntry | NetworkEntry | ErrorEntry;
}

// DevTools 数据响应
export interface DevToolsData {
  console?: ConsoleEntry[];
  network?: NetworkEntry[];
  errors?: ErrorEntry[];
  snapshot?: DomSnapshot;
}
