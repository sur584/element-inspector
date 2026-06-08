import type { Formatter, CopyFormatId, ElementInfo, UserConfig } from '../types';
import { aiFriendlyFormatter } from './ai-friendly';
import { jsonFormatter } from './json';
import { htmlFormatter } from './html';
import { cssSelectorFormatter } from './css-selector';

// 所有已注册的格式化器
const formatters: Formatter[] = [
  aiFriendlyFormatter,
  jsonFormatter,
  htmlFormatter,
  cssSelectorFormatter,
];

// 按 id 索引的映射表
const formatterMap = new Map<CopyFormatId, Formatter>(
  formatters.map((f) => [f.id, f]),
);

/**
 * 根据格式 ID 获取对应的格式化器
 */
export function getFormatter(id: CopyFormatId): Formatter | undefined {
  return formatterMap.get(id);
}

/**
 * 使用指定格式格式化元素信息
 */
export function formatElementInfo(
  info: ElementInfo,
  formatId: CopyFormatId,
  config: UserConfig,
): string {
  const formatter = formatterMap.get(formatId);
  if (!formatter) {
    return `[错误] 未知格式: ${formatId}`;
  }
  return formatter.format(info, config);
}

// 导出所有格式化器和单独的格式化器模块
export { aiFriendlyFormatter } from './ai-friendly';
export { jsonFormatter } from './json';
export { htmlFormatter } from './html';
export { cssSelectorFormatter } from './css-selector';
export type { Formatter } from '../types';
