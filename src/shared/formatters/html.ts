import type { Formatter, ElementInfo, UserConfig } from '../types';

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOpenTag(info: ElementInfo, config: UserConfig): string {
  const { visibleFields } = config;
  let tag = `<${info.tagName}`;

  if (visibleFields.id && info.id) {
    tag += ` id="${escapeHtml(info.id)}"`;
  }

  if (visibleFields.className && info.className) {
    tag += ` class="${escapeHtml(info.className)}"`;
  }

  if (visibleFields.attributes) {
    for (const [key, value] of Object.entries(info.attributes)) {
      // 跳过已单独处理的 id 和 class
      if (key === 'id' || key === 'class') continue;
      tag += ` ${escapeHtml(key)}="${escapeHtml(value)}"`;
    }
  }

  if (visibleFields.dataAttributes) {
    for (const [key, value] of Object.entries(info.dataAttributes)) {
      tag += ` ${escapeHtml(key)}="${escapeHtml(value)}"`;
    }
  }

  if (visibleFields.inlineStyles && info.inlineStyles) {
    tag += ` style="${escapeHtml(info.inlineStyles)}"`;
  }

  tag += '>';
  return tag;
}

export const htmlFormatter: Formatter = {
  id: 'html-snippet',
  label: 'HTML片段',
  description: 'HTML代码片段，适合粘贴到CodePen等工具',

  format(info: ElementInfo, config: UserConfig): string {
    const { visibleFields, advanced } = config;
    const { maxTextLength } = advanced;
    const openTag = buildOpenTag(info, config);

    // 如果是自闭合标签
    const voidTags = [
      'area', 'base', 'br', 'col', 'embed', 'hr',
      'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
    ];
    if (voidTags.includes(info.tagName.toLowerCase())) {
      return openTag.replace('>', ' />');
    }

    // 获取内容
    let content = '';
    if (visibleFields.innerHTML && info.innerHTML) {
      content = info.innerHTML.length > maxTextLength
        ? info.innerHTML.slice(0, maxTextLength) + '...'
        : info.innerHTML;
    } else if (visibleFields.textContent && info.textContent) {
      content = info.textContent.length > maxTextLength
        ? info.textContent.slice(0, maxTextLength) + '...'
        : info.textContent;
    }

    // 如果内容包含HTML标签，用代码块包裹
    const hasTags = content.includes('<');
    if (hasTags) {
      return [
        '<!-- HTML Snippet -->',
        openTag,
        `  ${content}`,
        `</${info.tagName}>`,
      ].join('\n');
    }

    // 纯文本内容
    return [
      '<!-- HTML Snippet -->',
      openTag,
      `  ${content}`,
      `</${info.tagName}>`,
    ].join('\n');
  },
};
