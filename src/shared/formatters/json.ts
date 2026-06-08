import type { Formatter, ElementInfo, UserConfig } from '../types';

interface JsonOutput {
  tagName?: string;
  id?: string | null;
  className?: string | null;
  classList?: string[];
  selector?: string;
  textContent?: string | null;
  innerHTML?: string | null;
  outerHTML?: string;
  inlineStyles?: string | null;
  computedStyles?: Record<string, string>;
  pseudoElements?: Record<string, string>;
  boundingBox?: { x: number; y: number; width: number; height: number } | null;
  attributes?: Record<string, string>;
  dataAttributes?: Record<string, string>;
  parent?: ElementInfo['parent'];
  children?: ElementInfo['children'];
}

export const jsonFormatter: Formatter = {
  id: 'json',
  label: 'JSON格式',
  description: 'JSON格式，包含所有信息的结构化数据',

  format(info: ElementInfo, config: UserConfig): string {
    const { visibleFields } = config;
    const output: JsonOutput = {};

    if (visibleFields.tagName) output.tagName = info.tagName;
    if (visibleFields.id) output.id = info.id;
    if (visibleFields.className) output.className = info.className;
    if (visibleFields.classList) output.classList = info.classList;
    if (visibleFields.selector) output.selector = info.selector;
    if (visibleFields.textContent) output.textContent = info.textContent;
    if (visibleFields.innerHTML) output.innerHTML = info.innerHTML;
    if (visibleFields.outerHTML) output.outerHTML = info.outerHTML;
    if (visibleFields.inlineStyles) output.inlineStyles = info.inlineStyles;
    if (visibleFields.computedStyles) output.computedStyles = info.computedStyles;
    if (visibleFields.pseudoElements) output.pseudoElements = info.pseudoElements;
    if (visibleFields.boundingBox && info.boundingBox) {
      output.boundingBox = {
        x: Math.round(info.boundingBox.x),
        y: Math.round(info.boundingBox.y),
        width: Math.round(info.boundingBox.width),
        height: Math.round(info.boundingBox.height),
      };
    } else if (visibleFields.boundingBox) {
      output.boundingBox = null;
    }
    if (visibleFields.attributes) output.attributes = info.attributes;
    if (visibleFields.dataAttributes) output.dataAttributes = info.dataAttributes;
    if (visibleFields.parent) output.parent = info.parent;
    if (visibleFields.children) output.children = info.children;

    return JSON.stringify(output, null, 2);
  },
};
