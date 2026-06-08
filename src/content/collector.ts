/**
 * Element Info Collector
 * Gathers structured information about DOM elements for inspection.
 */

import type { UserConfig, ElementInfo, InfoField } from '../shared/types';

// Subset of computed styles to capture by default
const COMPUTED_STYLE_KEYS = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'margin',
  'padding',
  'border',
  'background',
  'color',
  'font-size',
  'font-weight',
  'font-family',
  'line-height',
  'text-align',
  'text-decoration',
  'opacity',
  'overflow',
  'z-index',
  'box-shadow',
  'border-radius',
  'flex',
  'grid',
] as const;

// Tags excluded from selector generation
const SELF_CLOSING_TAGS = new Set([
  'BR', 'HR', 'IMG', 'INPUT', 'META', 'LINK', 'AREA', 'BASE',
  'COL', 'EMBED', 'PARAM', 'SOURCE', 'TRACK', 'WBR',
]);

/**
 * Build a CSS selector path for an element (up to 5 levels).
 * Uses CSS.escape for special characters.
 */
function buildSelector(el: Element): string {
  const segments: string[] = [];
  let current: Element | null = el;
  let depth = 0;

  while (current && current !== document.documentElement && depth < 5) {
    segments.unshift(selectify(current));
    current = current.parentElement;
    depth++;
  }

  return segments.join(' > ');
}

/** Generate a single selector segment for an element. */
function selectify(el: Element): string {
  const tag = el.tagName.toLowerCase();

  // Prefer id
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  // Use tag + classes
  const classes = Array.from(el.classList)
    .filter((c) => !c.startsWith('ei-'))
    .slice(0, 3);

  if (classes.length > 0) {
    const cls = classes.map((c) => `.${CSS.escape(c)}`).join('');
    return `${tag}${cls}`;
  }

  // nth-child fallback
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      (s) => s.tagName === el.tagName
    );
    if (siblings.length > 1) {
      const idx = siblings.indexOf(el) + 1;
      return `${tag}:nth-of-type(${idx})`;
    }
  }

  return tag;
}

/**
 * Truncate text to a maximum length, appending ellipsis if needed.
 */
function truncate(text: string | null, maxLen: number): string | null {
  if (text === null) return null;
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

/**
 * Collect computed styles for an element.
 * Only captures the keys listed in COMPUTED_STYLE_KEYS.
 */
function collectComputedStyles(
  el: Element,
  styleKeys: readonly string[]
): Record<string, string> {
  const styles: Record<string, string> = {};
  const computed = window.getComputedStyle(el);

  for (const key of styleKeys) {
    try {
      const value = computed.getPropertyValue(key);
      if (value && value !== 'initial' && value !== '') {
        styles[key] = value;
      }
    } catch {
      // Skip unsupported properties
    }
  }

  return styles;
}

/**
 * Collect pseudo-element styles (::before, ::after).
 */
function collectPseudoElements(el: Element): Record<string, string> {
  const pseudoStyles: Record<string, string> = {};
  const pseudoElements = ['::before', '::after'] as const;
  const pseudoKeys = ['content', 'display', 'position', 'background', 'color'];

  for (const pseudo of pseudoElements) {
    try {
      const computed = window.getComputedStyle(el, pseudo);
      const content = computed.getPropertyValue('content');
      if (content && content !== 'none' && content !== 'normal') {
        const pseudoInfo: Record<string, string> = {};
        for (const key of pseudoKeys) {
          const value = computed.getPropertyValue(key);
          if (value) pseudoInfo[key] = value;
        }
        if (Object.keys(pseudoInfo).length > 0) {
          pseudoStyles[pseudo] = JSON.stringify(pseudoInfo);
        }
      }
    } catch {
      // Skip unsupported pseudo elements
    }
  }

  return pseudoStyles;
}

/**
 * Collect all attributes on an element.
 */
function collectAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!el.attributes) return attrs;

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    attrs[attr.name] = attr.value;
  }

  return attrs;
}

/**
 * Collect data-* attributes specifically.
 */
function collectDataAttributes(el: Element): Record<string, string> {
  const dataAttrs: Record<string, string> = {};
  if (!el.attributes) return dataAttrs;

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    if (attr.name.startsWith('data-')) {
      dataAttrs[attr.name] = attr.value;
    }
  }

  return dataAttrs;
}

/**
 * Collect direct children info.
 */
function collectChildren(el: Element): { tagName: string; className: string }[] {
  const children: { tagName: string; className: string }[] = [];
  for (let i = 0; i < Math.min(el.children.length, 20); i++) {
    const child = el.children[i];
    children.push({
      tagName: child.tagName.toLowerCase(),
      className: child.getAttribute('class') || '',
    });
  }
  return children;
}

/**
 * Collect parent element info.
 */
function collectParent(
  el: Element
): { tagName: string; className: string; id: string | null } | null {
  const parent = el.parentElement;
  if (!parent) return null;
  return {
    tagName: parent.tagName.toLowerCase(),
    className: parent.getAttribute('class') || '',
    id: parent.id || null,
  };
}

/**
 * Main function: collect all requested info for a DOM element.
 *
 * @param el - The DOM element to inspect
 * @param config - User configuration controlling which fields to collect
 * @returns ElementInfo object with all collected data
 */
export function getElementInfo(el: Element, config: UserConfig): ElementInfo {
  const fields = config.visibleFields;
  const maxLen = config.advanced.maxTextLength;

  const info: ElementInfo = {
    tagName: el.tagName.toLowerCase(),
    id: fields.id ? (el.id || null) : null,
    className: fields.className ? (el.className || null) : null,
    classList: fields.classList ? Array.from(el.classList) : [],
    textContent: fields.textContent
      ? truncate(el.textContent, maxLen)
      : null,
    innerHTML: fields.innerHTML
      ? truncate(el.innerHTML, maxLen)
      : null,
    outerHTML: '',
    computedStyles: fields.computedStyles
      ? collectComputedStyles(el, COMPUTED_STYLE_KEYS)
      : {},
    inlineStyles: fields.inlineStyles
      ? el.getAttribute('style')
      : null,
    boundingBox: fields.boundingBox ? el.getBoundingClientRect() : null,
    attributes: fields.attributes ? collectAttributes(el) : {},
    children: fields.children ? collectChildren(el) : [],
    parent: fields.parent ? collectParent(el) : null,
    selector: fields.selector ? buildSelector(el) : '',
    pseudoElements: fields.pseudoElements
      ? collectPseudoElements(el)
      : {},
    dataAttributes: fields.dataAttributes
      ? collectDataAttributes(el)
      : {},
  };

  // outerHTML is always collected for clipboard use, but may not be displayed
  info.outerHTML = truncate(el.outerHTML, maxLen * 3) ?? el.outerHTML;

  return info;
}
