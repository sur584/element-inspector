import type { Formatter, ElementInfo, UserConfig } from '../types';

/** Escape HTML special characters to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return '(无)';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '... (已截断)';
}

function formatParent(parent: ElementInfo['parent']): string {
  if (!parent) return '(无)';
  let tag = `<${parent.tagName}`;
  if (parent.className) tag += ` class="${escapeHtml(parent.className)}"`;
  if (parent.id) tag += ` id="${escapeHtml(parent.id)}"`;
  tag += '>';
  return tag;
}

function formatChildren(children: ElementInfo['children']): string {
  if (children.length === 0) return '(无子元素)';
  const lines = children.map((child, i) => {
    let tag = `<${child.tagName}`;
    if (child.className) tag += ` class="${escapeHtml(child.className)}"`;
    tag += '>';
    return `${i + 1}. ${tag}`;
  });
  return lines.join('\n');
}

function formatAttributes(attributes: Record<string, string>): string {
  const keys = Object.keys(attributes);
  if (keys.length === 0) return '(无)';
  return keys.map((k) => `- ${k}="${attributes[k]}"`).join('\n');
}

function formatComputedStyles(styles: Record<string, string>): string {
  const keys = Object.keys(styles);
  if (keys.length === 0) return '(无)';
  return keys.map((k) => `- ${k}: ${styles[k]}`).join('\n');
}

function formatBoundingBox(box: DOMRect | null): string {
  if (!box) return '(不可用)';
  return `${Math.round(box.width)} x ${Math.round(box.height)} (x: ${Math.round(box.x)}, y: ${Math.round(box.y)})`;
}

export const aiFriendlyFormatter: Formatter = {
  id: 'ai-friendly',
  label: 'AI友好格式',
  description: '结构化文本，方便直接粘贴给AI进行修改',

  format(info: ElementInfo, config: UserConfig): string {
    const { visibleFields, advanced } = config;
    const { maxTextLength } = advanced;
    const sections: string[] = [];

    // -- 标题 --
    sections.push('## 元素信息\n');

    // -- 基础信息 --
    if (visibleFields.tagName) {
      sections.push(`**标签:** <${info.tagName}>`);
    }

    if (visibleFields.selector) {
      sections.push(`**选择器:** ${info.selector}`);
    }

    if (visibleFields.className && info.className) {
      sections.push(`**类名:** ${info.className}`);
    }

    if (visibleFields.id && info.id) {
      sections.push(`**ID:** ${info.id}`);
    }

    if (visibleFields.classList && info.classList.length > 0) {
      sections.push(`**类列表:** ${info.classList.join(', ')}`);
    }

    // -- 文本内容 --
    if (visibleFields.textContent) {
      sections.push('');
      sections.push('**文本内容:**');
      sections.push(truncateText(info.textContent, maxTextLength));
    }

    // -- 内联样式 --
    if (visibleFields.inlineStyles && info.inlineStyles) {
      sections.push('');
      sections.push('**内联样式:**');
      sections.push(info.inlineStyles);
    }

    // -- 计算样式 --
    if (visibleFields.computedStyles) {
      sections.push('');
      sections.push('**计算样式:**');
      sections.push(formatComputedStyles(info.computedStyles));
    }

    // -- 尺寸 --
    if (visibleFields.boundingBox) {
      sections.push('');
      sections.push(`**尺寸:** ${formatBoundingBox(info.boundingBox)}`);
    }

    // -- 父元素 --
    if (visibleFields.parent) {
      sections.push('');
      sections.push('**父元素:**');
      sections.push(formatParent(info.parent));
    }

    // -- 子元素 --
    if (visibleFields.children) {
      sections.push('');
      sections.push(`**子元素 (${info.children.length}):**`);
      sections.push(formatChildren(info.children));
    }

    // -- 属性 --
    if (visibleFields.attributes) {
      sections.push('');
      sections.push('**属性:**');
      sections.push(formatAttributes(info.attributes));
    }

    // -- 数据属性 --
    if (visibleFields.dataAttributes) {
      const dataKeys = Object.keys(info.dataAttributes);
      if (dataKeys.length > 0) {
        sections.push('');
        sections.push('**数据属性:**');
        sections.push(
          dataKeys.map((k) => `- ${k}="${info.dataAttributes[k]}"`).join('\n'),
        );
      }
    }

    // -- 伪元素 --
    if (visibleFields.pseudoElements) {
      const pseudoKeys = Object.keys(info.pseudoElements);
      if (pseudoKeys.length > 0) {
        sections.push('');
        sections.push('**伪元素:**');
        sections.push(
          pseudoKeys.map((k) => `- ${k}: ${info.pseudoElements[k]}`).join('\n'),
        );
      }
    }

    // -- 外部HTML --
    if (visibleFields.outerHTML) {
      sections.push('');
      sections.push('**外部HTML:**');
      sections.push('```html');
      sections.push(truncateText(info.outerHTML, maxTextLength * 3));
      sections.push('```');
    }

    // -- 尾部提示 --
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push('请帮我修改这个元素。我想要：');
    sections.push('1. [在此描述你的修改]');

    return sections.join('\n');
  },
};
