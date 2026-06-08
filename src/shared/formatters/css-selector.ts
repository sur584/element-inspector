import type { Formatter, ElementInfo, UserConfig } from '../types';

function buildSelectorPath(info: ElementInfo): string {
  // 用 info.selector 提供的完整CSS选择器路径
  return info.selector;
}

function formatStyles(styles: Record<string, string>): string {
  const keys = Object.keys(styles);
  if (keys.length === 0) return '';
  return keys.map((k) => `  ${k}: ${styles[k]};`).join('\n');
}

export const cssSelectorFormatter: Formatter = {
  id: 'css-selector',
  label: 'CSS选择器',
  description: 'CSS选择器路径和相关样式规则',

  format(info: ElementInfo, config: UserConfig): string {
    const { visibleFields } = config;
    const lines: string[] = [];

    // -- 选择器路径 --
    if (visibleFields.selector) {
      lines.push('/* CSS选择器 */');
      lines.push(`/* 路径: ${buildSelectorPath(info)} */`);
      lines.push('');
    }

    // -- 选择器规则 --
    const selector = info.selector || info.tagName;
    lines.push(`${selector} {`);

    // 内联样式
    if (visibleFields.inlineStyles && info.inlineStyles) {
      lines.push('  /* 内联样式 */');
      const inlineRules = info.inlineStyles
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const rule of inlineRules) {
        const colonIndex = rule.indexOf(':');
        if (colonIndex === -1) continue;
        const prop = rule.slice(0, colonIndex).trim();
        const val = rule.slice(colonIndex + 1).trim();
        lines.push(`  ${prop}: ${val};`);
      }
    }

    // 计算样式
    if (visibleFields.computedStyles && Object.keys(info.computedStyles).length > 0) {
      if (visibleFields.inlineStyles) {
        lines.push('');
        lines.push('  /* 计算样式 (仅作参考) */');
      }
      lines.push(formatStyles(info.computedStyles));
    }

    lines.push('}');

    // -- 伪元素 --
    if (visibleFields.pseudoElements) {
      const pseudoKeys = Object.keys(info.pseudoElements);
      if (pseudoKeys.length > 0) {
        lines.push('');
        for (const pseudo of pseudoKeys) {
          lines.push(`${selector}::${pseudo} {`);
          const contentValue = info.pseudoElements[pseudo];
          // Wrap content value in quotes if it's a string (not already quoted)
          const quotedContent = contentValue.startsWith('"') || contentValue.startsWith("'")
            ? contentValue
            : `"${contentValue}"`;
          lines.push(`  content: ${quotedContent};`);
          lines.push('}');
        }
      }
    }

    return lines.join('\n');
  },
};
