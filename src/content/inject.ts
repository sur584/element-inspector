/**
 * 页面注入脚本 - 在页面上下文中运行
 * 负责捕获 console 日志、网络请求、JS 错误
 */

const EVENT_NAME = 'ei-devtools-message';

// 安全序列化对象
function safeStringify(obj: unknown, maxDepth = 3): string {
  const seen = new WeakSet();

  const serializer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);

      // 深度限制
      const depth = _key.split('.').length;
      if (depth > maxDepth) return '[Truncated]';
    }

    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    if (typeof value === 'symbol') return value.toString();
    if (value instanceof Error) return `${value.message}\n${value.stack}`;
    if (value instanceof HTMLElement) return `<${value.tagName.toLowerCase()}>`;

    return value;
  };

  try {
    return JSON.stringify(obj, serializer, 2);
  } catch {
    return String(obj);
  }
}

// 发送消息到 content script
function sendMessage(type: string, data: unknown): void {
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: { type, data },
    })
  );
}

// 生成唯一 ID
let idCounter = 0;
function generateId(): string {
  return `ei_${Date.now()}_${++idCounter}`;
}

// ========== Console 拦截 ==========
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

function patchConsole(method: 'log' | 'info' | 'warn' | 'error' | 'debug'): void {
  const original = originalConsole[method];

  console[method] = (...args: unknown[]) => {
    // 调用原始方法
    original(...args);

    // 序列化参数
    const serializedArgs = args.map((arg) => safeStringify(arg));

    // 获取调用栈
    const stack = new Error().stack?.split('\n').slice(2, 4).join('\n');

    sendMessage('console', {
      id: generateId(),
      timestamp: Date.now(),
      level: method,
      args: serializedArgs,
      stackTrace: stack,
    });
  };
}

// 初始化 console 拦截
function initConsoleCapture(): void {
  patchConsole('log');
  patchConsole('info');
  patchConsole('warn');
  patchConsole('error');
  patchConsole('debug');
}

// ========== 网络请求拦截 ==========
function initNetworkCapture(): void {
  // 拦截 fetch
  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
    const startTime = Date.now();
    const [input, init] = args;
    const url = typeof input === 'string' ? input : input.url;
    const method = init?.method || 'GET';

    try {
      const response = await originalFetch.apply(this, args);
      const duration = Date.now() - startTime;

      // 克隆响应以读取 body
      const clonedResponse = response.clone();
      let responseBody = '';

      try {
        responseBody = await clonedResponse.text();
        if (responseBody.length > 10240) {
          responseBody = responseBody.substring(0, 10240) + '... [Truncated]';
        }
      } catch {
        responseBody = '[Unable to read response body]';
      }

      sendMessage('network', {
        id: generateId(),
        timestamp: startTime,
        method,
        url,
        statusCode: response.status,
        duration,
        requestHeaders: Object.fromEntries(response.headers.entries()),
        requestBody: init?.body ? safeStringify(init.body) : undefined,
        responseBody,
        type: 'fetch',
        size: responseBody.length,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      sendMessage('network', {
        id: generateId(),
        timestamp: startTime,
        method,
        url,
        statusCode: 0,
        duration,
        requestHeaders: {},
        requestBody: init?.body ? safeStringify(init.body) : undefined,
        responseBody: String(error),
        type: 'fetch',
        size: 0,
      });

      throw error;
    }
  };

  // 拦截 XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: Parameters<typeof originalOpen>
  ): void {
    (this as any).__ei_method = method;
    (this as any).__ei_url = String(url);
    (this as any).__ei_startTime = Date.now();

    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null): void {
    const startTime = (this as any).__ei_startTime;
    const method = (this as any).__ei_method;
    const url = (this as any).__ei_url;

    this.addEventListener('loadend', () => {
      const duration = Date.now() - startTime;
      let responseBody = '';

      try {
        responseBody = this.responseText || '';
        if (responseBody.length > 10240) {
          responseBody = responseBody.substring(0, 10240) + '... [Truncated]';
        }
      } catch {
        responseBody = '[Unable to read response body]';
      }

      sendMessage('network', {
        id: generateId(),
        timestamp: startTime,
        method,
        url,
        statusCode: this.status,
        duration,
        requestHeaders: {},
        requestBody: body ? safeStringify(body) : undefined,
        responseBody,
        type: 'xhr',
        size: responseBody.length,
      });
    });

    return originalSend.call(this, body);
  };
}

// ========== JS 错误捕获 ==========
function initErrorCapture(): void {
  window.addEventListener('error', (event: ErrorEvent) => {
    sendMessage('error', {
      id: generateId(),
      timestamp: Date.now(),
      message: event.message,
      source: event.filename || '',
      lineno: event.lineno,
      colno: event.colno,
      stackTrace: event.error?.stack,
      type: 'error',
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    sendMessage('error', {
      id: generateId(),
      timestamp: Date.now(),
      message: typeof reason === 'string' ? reason : safeStringify(reason),
      source: '',
      lineno: 0,
      colno: 0,
      stackTrace: reason instanceof Error ? reason.stack : undefined,
      type: 'unhandledrejection',
    });
  });
}

// ========== 初始化 ==========
function init(): void {
  // 防止重复注入
  if ((window as any).__ei_devtools_injected) return;
  (window as any).__ei_devtools_injected = true;

  initConsoleCapture();
  initNetworkCapture();
  initErrorCapture();

  console.log('[Element Inspector] DevTools 监控已启用');
}

// 立即初始化
init();
